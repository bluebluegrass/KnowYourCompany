import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { SECTION_DEFINITIONS } from "../config/sections.js";
import { validateFinalSummary, validateSectionAnalysis } from "../model/schema.js";
import { buildHtmlPath } from "../report/artifact-paths.js";
import type { ReportModel, SectionAnalysis } from "../types/index.js";
import { disclaimersBlock, escapeHtml, findingsList, paragraphsFromText, ratingsBlock, sourcesList, timelineBlock } from "./html-fragments.js";
import { loadTemplate } from "./template-loader.js";

const BADGE_LABELS: Record<string, string> = {
  no_concerns: "No concerns",
  mixed_signals: "Mixed signals",
  concern_found: "Concern found",
  no_data: "No data"
};

export function renderReport(template: string, styles: string, report: ReportModel): string {
  const sectionsById = new Map(report.sections.map((section) => [section.sectionId, section]));
  let html = template.replace(
    /\/\* ── PASTE references\/styles\.css HERE ───────────────────────── \*\//,
    styles.trim()
  );

  const replacements: Record<string, string> = {
    COMPANY: escapeHtml(report.company),
    DATE: escapeHtml(report.date),
    LOCATION: escapeHtml(report.location || ""),
    ROLE: escapeHtml(report.role || ""),
    VERDICT_TEXT: escapeHtml(report.verdict.verdictText),
    VERDICT_FLAGS: report.verdict.verdictFlags
      .map((flag) => `<span class="verdict-flag ${flag.tone}">${escapeHtml(flag.text)}</span>`)
      .join("\n"),
    PLACEHOLDER: "",
    X: "",
    X_LABEL: ""
  };

  for (const sectionDef of SECTION_DEFINITIONS) {
    const section = sectionsById.get(sectionDef.id) || createEmptySection(sectionDef.id, sectionDef.title);
    const slot = sectionDef.order;
    replacements[`B${slot}`] = section.severity;
    replacements[`B${slot}_LABEL`] = BADGE_LABELS[section.badgeLabelKey] ?? section.badgeLabelKey;
  }

  const section = (id: SectionAnalysis["sectionId"]) => sectionsById.get(id) || createEmptySection(id, "");

  replacements.LAYOFFS_CONTENT = renderGenericSection(section("layoffs"));
  replacements.LAYOFFS_SOURCES = sourcesList(section("layoffs").sourceRefs, report.sources);

  replacements.FUNDING_TIMELINE = timelineBlock(section("financial_health").timelineItems);
  replacements.FINANCIAL_SIGNALS = renderGenericSection(section("financial_health"));
  replacements.FINANCIAL_PLAIN_ENGLISH = escapeHtml(section("financial_health").plainEnglishFinanceText || "No data available.");
  replacements.FINANCIAL_SOURCES = sourcesList(section("financial_health").sourceRefs, report.sources);

  replacements.LEADERSHIP_CURRENT = paragraphsFromText(section("leadership_stability").summaryText);
  replacements.LEADERSHIP_DEPARTURES = findingsList(section("leadership_stability").keyFindings);
  replacements.LEADERSHIP_SOURCES = sourcesList(section("leadership_stability").sourceRefs, report.sources);

  replacements.LEGAL_CONTENT = `${disclaimersBlock(section("legal_regulatory").disclaimers)}\n${renderGenericSection(section("legal_regulatory"))}`;
  replacements.LEGAL_SOURCES = sourcesList(section("legal_regulatory").sourceRefs, report.sources);

  replacements.GLASSDOOR_RATINGS = ratingsBlock(section("company_culture").ratings);
  replacements.CULTURE_THEMES = renderGenericSection(section("company_culture"));
  replacements.CULTURE_COMMUNITY = findingsList(section("company_culture").keyFindings);
  replacements.CULTURE_SOURCES = sourcesList(section("company_culture").sourceRefs, report.sources);

  replacements.RTO_OFFICIAL = paragraphsFromText(section("work_policy").summaryText);
  replacements.RTO_CHANGES = findingsList(section("work_policy").keyFindings);
  replacements.RTO_SENTIMENT = disclaimersBlock(section("work_policy").disclaimers);
  replacements.RTO_SOURCES = sourcesList(section("work_policy").sourceRefs, report.sources);

  replacements.COMP_SALARY = paragraphsFromText(section("compensation_benefits").summaryText);
  replacements.COMP_EQUITY = findingsList(section("compensation_benefits").keyFindings);
  replacements.COMP_BENEFITS = disclaimersBlock(section("compensation_benefits").disclaimers);
  replacements.COMP_SOURCES = sourcesList(section("compensation_benefits").sourceRefs, report.sources);

  replacements.INTERVIEW_CONTENT = `${disclaimersBlock(section("interview_experience").disclaimers)}\n${renderGenericSection(section("interview_experience"))}`;
  replacements.INTERVIEW_SOURCES = sourcesList(section("interview_experience").sourceRefs, report.sources);

  replacements.VISA_CONTENT = renderGenericSection(section("visa_sponsorship"));
  replacements.VISA_SOURCES = sourcesList(section("visa_sponsorship").sourceRefs, report.sources);

  replacements.PRODUCT_CONTENT = `${ratingsBlock(section("product_market_health").ratings)}\n${renderGenericSection(section("product_market_health"))}`;
  replacements.PRODUCT_SOURCES = sourcesList(section("product_market_health").sourceRefs, report.sources);

  replacements.PROFILE_SUMMARY = paragraphsFromText(section("company_profile_history").summaryText);
  replacements.PROFILE_MILESTONES = findingsList(section("company_profile_history").keyFindings);
  replacements.PROFILE_SOURCES = sourcesList(section("company_profile_history").sourceRefs, report.sources);

  replacements.FOUNDER_CONTENT = renderGenericSection(section("founder_background"));
  replacements.FOUNDER_SOURCES = sourcesList(section("founder_background").sourceRefs, report.sources);

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{ ${key} }}`, value);
  }

  validateNoPlaceholdersRemain(html);
  return html;
}

export async function renderFromJson(jsonPath: string, outputDir?: string): Promise<{ report: ReportModel; html: string; outputPath: string }> {
  const raw = await readFile(jsonPath, "utf8");
  const report = parseReportModel(raw, jsonPath);
  const templateDir = path.resolve(process.cwd(), "references");
  const { template, styles } = await loadTemplate(
    path.join(templateDir, "template.html"),
    path.join(templateDir, "styles.css")
  );
  const html = renderReport(template, styles, report);
  const destinationDir = outputDir || path.dirname(jsonPath);
  const outputPath = buildHtmlPath(destinationDir, report.company, report.date);
  await writeFile(outputPath, html, "utf8");
  return { report, html, outputPath };
}

export function validateNoPlaceholdersRemain(html: string): void {
  const match = html.match(/\{\{[^}]+\}\}/);
  if (match) {
    throw new Error(`Unreplaced template placeholder found: ${match[0]}`);
  }
}

function createEmptySection(sectionId: SectionAnalysis["sectionId"], title: string): SectionAnalysis {
  return {
    sectionId,
    severity: "grey",
    badgeLabelKey: "no_data",
    title,
    summaryText: "No data found for this section.",
    keyFindings: [],
    disclaimers: [],
    ratings: [],
    timelineItems: [],
    sourceRefs: []
  };
}

function renderGenericSection(section: SectionAnalysis): string {
  const paragraphs = paragraphsFromText(section.summaryText);
  const list = findingsList(section.keyFindings);
  const disclaimers = disclaimersBlock(section.disclaimers);
  return [disclaimers, paragraphs, list].filter(Boolean).join("\n");
}

function parseReportModel(raw: string, jsonPath: string): ReportModel {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse report JSON at ${jsonPath}: ${(error as Error).message}`);
  }

  if (!value || typeof value !== "object") {
    throw new Error(`Report JSON at ${jsonPath} must contain an object.`);
  }

  const report = value as Record<string, unknown>;
  assertString(report.company, "company");
  assertString(report.date, "date");
  if (report.location !== undefined) {
    assertString(report.location, "location");
  }
  if (report.role !== undefined) {
    assertString(report.role, "role");
  }
  validateFinalSummary(report.verdict);
  if (!Array.isArray(report.sections)) {
    throw new Error("sections must be an array.");
  }
  for (const section of report.sections) {
    validateSectionAnalysis(section);
  }
  if (!report.sources || typeof report.sources !== "object" || Array.isArray(report.sources)) {
    throw new Error("sources must be an object.");
  }

  return report as unknown as ReportModel;
}

function assertString(value: unknown, field: string): void {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
}
