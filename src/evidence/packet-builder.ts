import { createHash } from "node:crypto";
import type { EvidencePacket, EvidenceSnippet, InputContext, SectionId, SourceDocument } from "../types/index.js";
import { DEFAULT_MAX_EVIDENCE_PER_SECTION } from "../config/constants.js";
import { getSectionDefinition } from "../config/sections.js";
import { dedupeEvidence } from "./dedupe.js";
import { scoreSnippet } from "./scorer.js";
import { extractRelevantSnippet } from "../retrieval/cleaner.js";
import { recencyReason, shouldIncludeByRecency } from "../retrieval/recency.js";

export function buildEvidencePacket(
  sectionId: SectionId,
  input: InputContext,
  documents: SourceDocument[],
  queryCount: number
): EvidencePacket {
  const definition = getSectionDefinition(sectionId);
  const snippets: EvidenceSnippet[] = [];
  let recencyFilteredCount = 0;

  for (const source of documents) {
    const materialActiveRisk =
      definition.id === "legal_regulatory" && /active|ongoing|pending|unresolved/i.test(source.text);
    if (!shouldIncludeByRecency(sectionId, source.publishedAt, input.now, materialActiveRisk)) {
      continue;
    }
    recencyFilteredCount += 1;
    const base = extractRelevantSnippet(source, sectionId, input.company, input.role);
    snippets.push({
      ...base,
      sectionId,
      sourceId: source.normalizedUrl,
      translated: source.language !== "en",
      excerptCanonical: base.excerptOriginal,
      relevanceScore: 0,
      includedViaException: materialActiveRisk,
      inclusionReason: recencyReason(sectionId, source.publishedAt, input.now, materialActiveRisk)
    });
  }

  const scored = snippets
    .map((snippet) => ({
      ...snippet,
      relevanceScore: scoreSnippet(snippet, sectionId, input.now)
    }))
    .sort((left, right) => right.relevanceScore - left.relevanceScore);

  const deduped = dedupeEvidence(scored).slice(0, DEFAULT_MAX_EVIDENCE_PER_SECTION);
  return {
    sectionId,
    company: input.company,
    ...(input.role ? { role: input.role } : {}),
    ...(input.location ? { location: input.location } : {}),
    canonicalLanguage: input.canonicalLanguage,
    evidenceHash: hashEvidence(deduped),
    evidence: deduped,
    stats: {
      queryCount,
      retrievedCount: documents.length,
      recencyFilteredCount,
      sentToModelCount: deduped.length
    }
  };
}

function hashEvidence(evidence: EvidenceSnippet[]): string {
  const hash = createHash("sha256");
  for (const item of evidence) {
    hash.update(JSON.stringify(item));
  }
  return hash.digest("hex");
}
