import type { EvidenceSnippet } from "../types/index.js";

export function dedupeEvidence(snippets: EvidenceSnippet[], maxCommunityItems: number): EvidenceSnippet[] {
  const seen = new Set<string>();
  const communityThemes = new Set<string>();
  const deduped: EvidenceSnippet[] = [];

  for (const snippet of snippets) {
    const key = `${snippet.url}|${normalizeComplaint(snippet.excerptCanonical)}`;
    if (seen.has(key)) {
      continue;
    }
    if (snippet.sourceType === "community") {
      const theme = normalizeComplaint(snippet.excerptCanonical).slice(0, 120);
      if (communityThemes.has(theme)) {
        continue;
      }
      const existingCommunity = deduped.filter((item) => item.sourceType === "community").length;
      if (existingCommunity >= maxCommunityItems) {
        continue;
      }
      communityThemes.add(theme);
    }
    seen.add(key);
    deduped.push(snippet);
  }
  return deduped;
}

function normalizeComplaint(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
