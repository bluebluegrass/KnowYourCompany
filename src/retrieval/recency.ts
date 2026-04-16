import { getSectionDefinition } from "../config/sections.js";
import type { SectionId } from "../types/index.js";

export function getRecencyWindowMonths(sectionId: SectionId): number | undefined {
  return getSectionDefinition(sectionId).recencyMonths;
}

export function shouldIncludeByRecency(
  sectionId: SectionId,
  publishedAt: string | undefined,
  nowIso: string,
  materialActiveRisk = false
): boolean {
  const definition = getSectionDefinition(sectionId);
  if (!definition.recencyMonths) {
    return true;
  }
  if (!publishedAt) {
    return definition.allowDurableSources && materialActiveRisk;
  }
  if (materialActiveRisk) {
    return true;
  }
  const published = new Date(publishedAt);
  const now = new Date(nowIso);
  const diffMonths =
    (now.getUTCFullYear() - published.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - published.getUTCMonth());
  return diffMonths <= definition.recencyMonths;
}

export function recencyReason(
  sectionId: SectionId,
  publishedAt: string | undefined,
  nowIso: string,
  materialActiveRisk = false
): string {
  const windowMonths = getRecencyWindowMonths(sectionId);
  if (!windowMonths) {
    return "durable-background-source";
  }
  if (materialActiveRisk) {
    return "exception-material-current-risk";
  }
  if (!publishedAt) {
    return "out-of-window-undated";
  }
  return shouldIncludeByRecency(sectionId, publishedAt, nowIso, materialActiveRisk)
    ? `within-${windowMonths}-months`
    : `outside-${windowMonths}-months`;
}
