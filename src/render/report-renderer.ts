import { SECTION_DEFINITIONS } from "../config/sections.js";
import { createUiStrings } from "../localization/ui-strings.js";
import type { ReportModel, SectionAnalysis } from "../types/index.js";
import { disclaimersBlock, escapeHtml, findingsList, paragraphsFromText, ratingsBlock, sourcesList, timelineBlock } from "./html-fragments.js";

export function renderReport(template: string, styles: string, report: ReportModel): string {
  const ui = createUiStrings(report.outputLanguage);
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
    replacements[`B${slot}_LABEL`] = ui.badgeLabel(section.badgeLabelKey);
  }

  const section = (id: SectionAnalysis["sectionId"]) => sectionsById.get(id) || createEmptySection(id, "");

  replacements.LAYOFFS_CONTENT = renderGenericSection(section("layoffs"));
  replacements.LAYOFFS_SOURCES = sourcesList(section("layoffs").sourceRefs, report.sources);

  replacements.FUNDING_TIMELINE = timelineBlock(section("financial_health").timelineItems);
  replacements.FINANCIAL_SIGNALS = renderGenericSection(section("financial_health"));
  replacements.FINANCIAL_PLAIN_ENGLISH = escapeHtml(section("financial_health").plainEnglishFinanceText || ui.label("no_data_section"));
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

  html = html.replace(/<html lang="en">/, `<html lang="${ui.htmlLang}">`);

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{ ${key} }}`, value);
  }

  validateNoPlaceholdersRemain(html);
  return html;
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
    sourceRefs: [],
    translatedSourceLabels: []
  };
}

function renderGenericSection(section: SectionAnalysis): string {
  const paragraphs = paragraphsFromText(section.summaryText);
  const list = findingsList(section.keyFindings);
  const disclaimers = disclaimersBlock(section.disclaimers);
  return [disclaimers, paragraphs, list].filter(Boolean).join("\n");
}
