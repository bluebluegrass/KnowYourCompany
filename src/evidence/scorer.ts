import type { EvidenceSnippet, SectionId } from "../types/index.js";
import { getRecencyWindowMonths } from "../retrieval/recency.js";

export function scoreSnippet(snippet: EvidenceSnippet, sectionId: SectionId, nowIso: string): number {
  const recencyWindow = getRecencyWindowMonths(sectionId);
  const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : undefined;
  const now = new Date(nowIso);
  const agePenalty =
    recencyWindow && publishedAt
      ? Math.max(
          0,
          ((now.getUTCFullYear() - publishedAt.getUTCFullYear()) * 12 +
            (now.getUTCMonth() - publishedAt.getUTCMonth())) / recencyWindow
        )
      : 0.25;
  const communityPenalty = snippet.sourceType === "community" ? 0.1 : 0;
  const translatedPenalty = snippet.translated ? 0.05 : 0;
  return Math.max(0, snippet.trustScore + 0.4 - agePenalty - communityPenalty - translatedPenalty);
}
