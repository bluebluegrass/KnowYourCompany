import type { CandidateProfile, Claim, FinalSummary, FinanceProfile, ReportV2, SectionAnalysis } from "../types/index.js";

const VALID_SEVERITIES = new Set(["green", "yellow", "red", "grey"]);
const VALID_BADGE_KEYS = new Set(["no_concerns", "mixed_signals", "concern_found", "no_data"]);
const VALID_FINANCE_COMPANY_TYPES = new Set(["public", "startup", "private", "subsidiary", "unknown"]);
const VALID_FINANCE_TRENDS = new Set(["improving", "stable", "worsening", "mixed", "unknown"]);
const VALID_FINANCE_CONFIDENCE = new Set(["high", "medium", "low"]);
const VALID_FINANCE_EVENT_KINDS = new Set(["earnings", "funding", "ipo", "ownership", "other"]);

export function validateSectionAnalysis(value: unknown): asserts value is SectionAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Section analysis must be an object.");
  }
  const section = value as Record<string, unknown>;
  assertString(section.sectionId, "sectionId");
  assertSeverity(section.severity);
  if (typeof section.badgeLabelKey !== "string" || !VALID_BADGE_KEYS.has(section.badgeLabelKey)) {
    throw new Error("Invalid badgeLabelKey.");
  }
  assertString(section.title, "title");
  assertString(section.summaryText, "summaryText");
  assertFindingArray(section.keyFindings);
  assertStringArray(section.disclaimers, "disclaimers");
  if (section.plainEnglishFinanceText !== undefined) {
    assertString(section.plainEnglishFinanceText, "plainEnglishFinanceText");
  }
  if (section.financeProfile !== undefined) validateFinanceProfile(section.financeProfile);
  assertRatingArray(section.ratings);
  assertTimelineArray(section.timelineItems);
  assertStringArray(section.sourceRefs, "sourceRefs");
  if (section.claims !== undefined) assertModelClaimArray(section.claims);
}

function assertModelClaimArray(value: unknown): void {
  if (!Array.isArray(value)) throw new Error("claims must be an array.");
  for (const claim of value) {
    if (!claim || typeof claim !== "object") throw new Error("model claim must be an object.");
    const item = claim as Record<string, unknown>;
    assertString(item.text, "claim.text");
    assertStringArray(item.sourceRefs, "claim.sourceRefs");
    if (item.scope !== undefined && (!item.scope || typeof item.scope !== "object" || Array.isArray(item.scope))) throw new Error("claim.scope must be an object.");
    if (item.impact !== undefined && !["blocking", "material", "watch", "informational"].includes(String(item.impact))) throw new Error("Invalid claim impact.");
    if (item.evidenceState !== undefined && !["verified", "corroborated", "limited", "conflicting", "insufficient"].includes(String(item.evidenceState))) throw new Error("Invalid claim evidenceState.");
  }
}

export function validateFinalSummary(value: unknown): asserts value is FinalSummary {
  if (!value || typeof value !== "object") {
    throw new Error("Final summary must be an object.");
  }
  const summary = value as Record<string, unknown>;
  assertString(summary.verdictText, "verdictText");
  if (!Array.isArray(summary.verdictFlags)) {
    throw new Error("verdictFlags must be an array.");
  }
  for (const flag of summary.verdictFlags) {
    if (!flag || typeof flag !== "object") {
      throw new Error("verdictFlags items must be objects.");
    }
    const item = flag as Record<string, unknown>;
    assertSeverity(item.tone);
    assertString(item.text, "flag.text");
  }
}

export function validateReportV2(value: unknown): asserts value is ReportV2 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Report v2 must be an object.");
  const report = value as Record<string, unknown>;
  if (report.reportVersion !== 2) throw new Error("Unsupported report version.");
  assertString(report.reportId, "reportId");
  assertString(report.generatedAt, "generatedAt");
  assertTarget(report.target);
  if (report.candidateProfile !== undefined) validateCandidateProfile(report.candidateProfile);
  if (!report.sources || typeof report.sources !== "object" || Array.isArray(report.sources)) throw new Error("sources must be an object.");
  if (!Array.isArray(report.sections)) throw new Error("sections must be an array.");
  for (const section of report.sections) validateV2Section(section);
  if (!Array.isArray(report.actions)) throw new Error("actions must be an array.");
  if (!report.decision || typeof report.decision !== "object") throw new Error("decision must be an object.");
  if (!Array.isArray(report.validationWarnings)) throw new Error("validationWarnings must be an array.");
}

function validateV2Section(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("v2 section must be an object.");
  const section = value as Record<string, unknown>;
  assertString(section.sectionId, "sectionId");
  assertString(section.title, "title");
  assertString(section.summary, "summary");
  if (!Array.isArray(section.claims)) throw new Error("claims must be an array.");
  for (const claim of section.claims) validateClaim(claim);
  if (section.financePlainLanguage !== undefined) assertString(section.financePlainLanguage, "financePlainLanguage");
  if (section.financeProfile !== undefined) validateFinanceProfile(section.financeProfile);
}

function validateFinanceProfile(value: unknown): asserts value is FinanceProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("financeProfile must be an object.");
  const profile = value as Record<string, unknown>;
  if (typeof profile.companyType !== "string" || !VALID_FINANCE_COMPANY_TYPES.has(profile.companyType)) throw new Error("Invalid financeProfile.companyType.");
  if (typeof profile.confidence !== "string" || !VALID_FINANCE_CONFIDENCE.has(profile.confidence)) throw new Error("Invalid financeProfile.confidence.");
  assertFinanceTrend(profile.trend, "financeProfile.trend");
  assertStringArray(profile.sourceRefs, "financeProfile.sourceRefs");
  assertFinanceMetricArray(profile.metrics);
  assertFinanceEventArray(profile.events);
  assertStringArray(profile.jobSeekerImplications, "financeProfile.jobSeekerImplications");
  assertStringArray(profile.unknowns, "financeProfile.unknowns");
}

function assertFinanceMetricArray(value: unknown): void {
  if (!Array.isArray(value)) throw new Error("financeProfile.metrics must be an array.");
  for (const metric of value) {
    if (!metric || typeof metric !== "object" || Array.isArray(metric)) throw new Error("financeProfile metric must be an object.");
    const item = metric as Record<string, unknown>;
    assertString(item.label, "financeProfile.metrics.label");
    assertString(item.value, "financeProfile.metrics.value");
    if (item.period !== undefined) assertString(item.period, "financeProfile.metrics.period");
    if (item.trend !== undefined) assertFinanceTrend(item.trend, "financeProfile.metrics.trend");
    assertStringArray(item.sourceRefs, "financeProfile.metrics.sourceRefs");
  }
}

function assertFinanceEventArray(value: unknown): void {
  if (!Array.isArray(value)) throw new Error("financeProfile.events must be an array.");
  for (const event of value) {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("financeProfile event must be an object.");
    const item = event as Record<string, unknown>;
    if (typeof item.kind !== "string" || !VALID_FINANCE_EVENT_KINDS.has(item.kind)) throw new Error("Invalid financeProfile.events.kind.");
    assertString(item.title, "financeProfile.events.title");
    assertString(item.detail, "financeProfile.events.detail");
    if (item.date !== undefined) assertString(item.date, "financeProfile.events.date");
    assertStringArray(item.sourceRefs, "financeProfile.events.sourceRefs");
  }
}

function assertFinanceTrend(value: unknown, field: string): void {
  if (typeof value !== "string" || !VALID_FINANCE_TRENDS.has(value)) throw new Error(`Invalid ${field}.`);
}

function validateClaim(value: unknown): asserts value is Claim {
  if (!value || typeof value !== "object") throw new Error("claim must be an object.");
  const claim = value as Record<string, unknown>;
  for (const key of ["claimId", "sectionId", "text", "impact", "evidenceState", "freshness", "candidateFit"] as const) assertString(claim[key], key);
  assertStringArray(claim.sourceRefs, "claim.sourceRefs");
  if (!claim.scope || typeof claim.scope !== "object" || Array.isArray(claim.scope)) throw new Error("claim.scope must be an object.");
  assertStringArray(claim.actionRefs, "claim.actionRefs");
}

function assertTarget(value: unknown): void {
  if (!value || typeof value !== "object") throw new Error("target must be an object.");
  const target = value as Record<string, unknown>;
  assertString(target.company, "target.company");
  if (target.role !== undefined) assertString(target.role, "target.role");
  if (target.location !== undefined) assertString(target.location, "target.location");
}

function validateCandidateProfile(value: unknown): asserts value is CandidateProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("candidateProfile must be an object.");
  const profile = value as Record<string, unknown>;
  if (profile.minimumCompensation !== undefined && (!profile.minimumCompensation || typeof profile.minimumCompensation !== "object")) throw new Error("minimumCompensation must be an object.");
}

function assertString(value: unknown, field: string): void {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
  if (/<[a-z][\s\S]*>/i.test(value)) {
    throw new Error(`${field} must be plain text, not raw HTML.`);
  }
}

function assertStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be an array of strings.`);
  }
}

function assertFindingArray(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new Error("keyFindings must be an array.");
  }
  for (const finding of value) {
    if (!finding || typeof finding !== "object") {
      throw new Error("Finding must be an object.");
    }
    const item = finding as Record<string, unknown>;
    assertString(item.text, "finding.text");
    assertStringArray(item.sourceRefs, "finding.sourceRefs");
  }
}

function assertRatingArray(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new Error("ratings must be an array.");
  }
  for (const row of value) {
    if (!row || typeof row !== "object") {
      throw new Error("rating row must be an object.");
    }
    const item = row as Record<string, unknown>;
    assertString(item.label, "rating.label");
    assertString(item.value, "rating.value");
    if (item.stars !== undefined) {
      assertString(item.stars, "rating.stars");
    }
  }
}

function assertTimelineArray(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new Error("timelineItems must be an array.");
  }
  for (const row of value) {
    if (!row || typeof row !== "object") {
      throw new Error("timeline item must be an object.");
    }
    const item = row as Record<string, unknown>;
    assertString(item.title, "timeline.title");
    assertString(item.meta, "timeline.meta");
  }
}

function assertSeverity(value: unknown): void {
  if (typeof value !== "string" || !VALID_SEVERITIES.has(value)) {
    throw new Error(`Invalid severity: ${String(value)}`);
  }
}
