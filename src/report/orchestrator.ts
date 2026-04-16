import path from "node:path";
import { writeFile } from "node:fs/promises";
import { FileCache } from "../cache/file-cache.js";
import { DEFAULT_CANONICAL_LANGUAGE, DEFAULT_OUTPUT_LANGUAGE } from "../config/constants.js";
import { SECTION_DEFINITIONS } from "../config/sections.js";
import { buildEvidencePacket } from "../evidence/packet-builder.js";
import { RunLogger } from "../logging/run-logger.js";
import { AnthropicClient, type ModelClient } from "../model/anthropic-client.js";
import { SectionAnalyzer } from "../model/section-analyzer.js";
import { normalizeEvidenceToCanonicalLanguage } from "../localization/canonicalizer.js";
import { ModelTranslator, PassthroughTranslator, type Translator } from "../localization/translator.js";
import { loadTemplate } from "../render/template-loader.js";
import { renderReport } from "../render/report-renderer.js";
import { Fetcher } from "../retrieval/fetcher.js";
import { buildQueryPlan } from "../retrieval/query-planner.js";
import { SearchClient } from "../retrieval/search-client.js";
import type { InputContext, ReportModel, SourceDocument } from "../types/index.js";

export interface Dependencies {
  logger?: RunLogger;
  model?: ModelClient;
  translator?: Translator;
}

export async function runReport(
  input: Omit<InputContext, "canonicalLanguage" | "now"> & { canonicalLanguage?: string; now?: string },
  dependencies: Dependencies = {}
): Promise<{ report: ReportModel; html: string; outputPath: string; logger: RunLogger }> {
  const logger = dependencies.logger || new RunLogger();
  const cache = new FileCache(path.join(process.cwd(), ".cache"), logger);
  const model = dependencies.model || new AnthropicClient(logger);
  const translator = dependencies.translator || new ModelTranslator(model, cache);
  const analyzer = new SectionAnalyzer(model, cache);
  const searchClient = new SearchClient();
  const fetcher = new Fetcher(cache);

  const context: InputContext = {
    ...input,
    outputLanguage: input.outputLanguage || DEFAULT_OUTPUT_LANGUAGE,
    canonicalLanguage: input.canonicalLanguage || DEFAULT_CANONICAL_LANGUAGE,
    now: input.now || new Date().toISOString()
  };

  const queries = buildQueryPlan(context);
  const documentsBySection = new Map<string, SourceDocument[]>();

  for (const section of SECTION_DEFINITIONS) {
    const sectionQueries = queries
      .filter((query) => query.sectionId === section.id)
      .sort((left, right) => left.priority - right.priority)
      .slice(0, section.maxQueries);
    logger.recordSearchCount(section.id, sectionQueries.length);
    const searchResults = (await Promise.all(sectionQueries.map((query) => searchClient.search(query).catch(() => [])))).flat();
    const documents = await Promise.all(
      searchResults.slice(0, section.maxFetchedPages).map((result) => fetcher.fetch(result).catch(() => undefined))
    );
    const resolved = documents.filter((item): item is SourceDocument => Boolean(item));
    logger.recordRetrievedCount(section.id, resolved.length);
    documentsBySection.set(section.id, resolved);
  }

  const sections = [];
  const sourceRegistry: Record<string, SourceDocument> = {};
  for (const section of SECTION_DEFINITIONS) {
    const started = Date.now();
    const queryCount = queries
      .filter((query) => query.sectionId === section.id)
      .sort((left, right) => left.priority - right.priority)
      .slice(0, section.maxQueries).length;
    const packet = buildEvidencePacket(
      section.id,
      context,
      documentsBySection.get(section.id) || [],
      queryCount
    );
    logger.recordDedupedCount(section.id, packet.evidence.length);
    logger.recordSectionEvidence(section.id, packet.evidence.length);
    const normalizedPacket = await normalizeEvidenceToCanonicalLanguage(packet, context.canonicalLanguage, translator);
    const analysis = await analyzer.analyze(normalizedPacket);
    sections.push(analysis);
    logger.recordSectionLatency(section.id, Date.now() - started);
    for (const source of documentsBySection.get(section.id) || []) {
      sourceRegistry[source.normalizedUrl] = source;
    }
  }

  const verdict = await analyzer.summarize(context.company, sections);
  const localizedBundle = await translator.translateTextBundle(
    {
      summary: verdict,
      sections
    },
    {
      canonicalLanguage: context.canonicalLanguage,
      outputLanguage: context.outputLanguage
    }
  );
  const report: ReportModel = {
    company: context.company,
    date: context.now.slice(0, 10),
    outputLanguage: context.outputLanguage,
    ...(context.location ? { location: context.location } : {}),
    ...(context.role ? { role: context.role } : {}),
    verdict: localizedBundle.summary,
    sections: localizedBundle.sections.sort((left, right) => severityOrder(left.severity) - severityOrder(right.severity)),
    sources: sourceRegistry
  };

  const { template, styles } = await loadTemplate(
    path.join(process.cwd(), "references", "template.html"),
    path.join(process.cwd(), "references", "styles.css")
  );
  const html = renderReport(template, styles, report);
  const fileName = `${context.company.replace(/\s+/g, "_")}_KnowYourCompany_${report.date}.html`;
  const outputPath = path.join(context.outputDir, fileName);
  await writeFile(outputPath, html, "utf8");
  return { report, html, outputPath, logger };
}

function severityOrder(severity: string): number {
  switch (severity) {
    case "red":
      return 0;
    case "yellow":
      return 1;
    case "green":
      return 2;
    default:
      return 3;
  }
}
