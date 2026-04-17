import type { FinalSummary, SectionAnalysis } from "../types/index.js";

const VALID_SEVERITIES = new Set(["green", "yellow", "red", "grey"]);
const VALID_BADGE_KEYS = new Set(["no_concerns", "mixed_signals", "concern_found", "no_data"]);

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
  assertRatingArray(section.ratings);
  assertTimelineArray(section.timelineItems);
  assertStringArray(section.sourceRefs, "sourceRefs");
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
