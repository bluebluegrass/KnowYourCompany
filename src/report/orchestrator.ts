import path from "node:path";
import { writeFile } from "node:fs/promises";
import { FileCache } from "../cache/file-cache.js";
import { SECTION_DEFINITIONS } from "../config/sections.js";
import { buildEvidencePacket } from "../evidence/evidence-pipeline.js";
import { RunLogger } from "../logging/run-logger.js";
import { ClaudeCodeModelClient } from "../model/claude-code-client.js";
import { type ModelClient } from "../model/anthropic-client.js";
import { SectionAnalyzer } from "../model/section-analyzer.js";
import { ClaudeCodeFetcher, ClaudeCodeSearchClient } from "../retrieval/claude-code-web.js";
import { buildQueryPlan } from "../retrieval/query-planner.js";
import type { InputContext, QueryPlan, ReportModel, SearchResult, SourceDocument } from "../types/index.js";
import { buildJsonPath } from "./artifact-paths.js";

export interface SearchService {
  search(query: QueryPlan): Promise<SearchResult[]>;
}

export interface FetchService {
  fetch(result: SearchResult): Promise<SourceDocument>;
}

export interface Dependencies {
  logger?: RunLogger;
  model?: ModelClient;
  searchClient?: SearchService;
  fetcher?: FetchService;
}

export async function runReport(
  input: Omit<InputContext, "now"> & { now?: string },
  dependencies: Dependencies = {}
): Promise<{ report: ReportModel; jsonPath: string; logger: RunLogger }> {
  const logger = dependencies.logger || new RunLogger();
  const cache = new FileCache(path.join(process.cwd(), ".cache"), logger);
  const model = dependencies.model || new ClaudeCodeModelClient(logger);
  const analyzer = new SectionAnalyzer(model, cache);
  const searchClient = dependencies.searchClient || new ClaudeCodeSearchClient();
  const fetcher = dependencies.fetcher || new ClaudeCodeFetcher(cache);

  const context: InputContext = {
    ...input,
    now: input.now || new Date().toISOString()
  };

  const queries = buildQueryPlan(context);
  const documentsBySection = new Map<string, SourceDocument[]>();
  const queriesBySection = new Map(
    SECTION_DEFINITIONS.map((section) => [section.id, selectSectionQueries(queries, section.id, section.maxQueries)])
  );

  for (const section of SECTION_DEFINITIONS) {
    const sectionQueries = queriesBySection.get(section.id) || [];
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
    const queryCount = (queriesBySection.get(section.id) || []).length;
    const packet = buildEvidencePacket(
      section.id,
      context,
      documentsBySection.get(section.id) || [],
      queryCount
    );
    logger.recordDedupedCount(section.id, packet.evidence.length);
    logger.recordSectionEvidence(section.id, packet.evidence.length);
    const analysis = await analyzer.analyze(packet);
    sections.push(analysis);
    logger.recordSectionLatency(section.id, Date.now() - started);
    registerSources(sourceRegistry, documentsBySection.get(section.id) || []);
  }

  const verdict = await analyzer.summarize(context.company, sections);
  const report: ReportModel = {
    company: context.company,
    date: context.now.slice(0, 10),
    ...(context.location ? { location: context.location } : {}),
    ...(context.role ? { role: context.role } : {}),
    verdict,
    sections: sections.sort((left, right) => severityOrder(left.severity) - severityOrder(right.severity)),
    sources: sourceRegistry
  };

  const jsonPath = buildJsonPath(context.outputDir, report.company, report.date);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { report, jsonPath, logger };
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

function selectSectionQueries(queries: QueryPlan[], sectionId: string, maxQueries: number): QueryPlan[] {
  return queries
    .filter((query) => query.sectionId === sectionId)
    .sort((left, right) => left.priority - right.priority)
    .slice(0, maxQueries);
}

function registerSources(registry: Record<string, SourceDocument>, sources: SourceDocument[]): void {
  for (const source of sources) {
    registry[source.normalizedUrl] = source;
  }
}
