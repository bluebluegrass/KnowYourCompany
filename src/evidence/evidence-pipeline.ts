import { createHash } from "node:crypto";
import { getSectionDefinition } from "../config/sections.js";
import type { EvidencePacket, EvidenceSnippet, InputContext, SectionId, SourceDocument } from "../types/index.js";

export function buildEvidencePacket(
  sectionId: SectionId,
  input: InputContext,
  documents: SourceDocument[],
  queryCount: number
): EvidencePacket {
  const definition = getSectionDefinition(sectionId);
  const { recencyFilteredCount, snippets } = buildSnippetCandidates(sectionId, input, documents);
  const selected = scoreAndSelectEvidence(sectionId, input.now, snippets, definition.maxCommunityItems, definition.maxEvidenceItems);
  return {
    sectionId,
    company: input.company,
    ...(input.role ? { role: input.role } : {}),
    ...(input.location ? { location: input.location } : {}),
    evidenceHash: hashEvidence(selected),
    evidence: selected,
    stats: {
      queryCount,
      retrievedCount: documents.length,
      recencyFilteredCount,
      sentToModelCount: selected.length
    }
  };
}

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

function extractRelevantSnippet(
  source: SourceDocument,
  sectionId: EvidenceSnippet["sectionId"],
  company: string,
  role?: string
): Omit<EvidenceSnippet, "sectionId" | "sourceId" | "translated" | "excerptCanonical" | "relevanceScore" | "includedViaException" | "inclusionReason"> {
  const keywords = [company, role || "", ...sectionKeywords(sectionId)].filter(Boolean);
  const text = source.text;
  let excerpt = text.slice(0, 800);
  for (const keyword of keywords) {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index !== -1) {
      excerpt = text.slice(Math.max(0, index - 160), Math.min(text.length, index + 420));
      break;
    }
  }

  return {
    snippetId: hashContent(`${source.normalizedUrl}:${sectionId}:${excerpt}`),
    title: source.title,
    url: source.url,
    sourceType: source.sourceType,
    sourceLanguage: source.language,
    ...(source.publishedAt ? { publishedAt: source.publishedAt } : {}),
    fetchedAt: source.fetchedAt,
    excerptOriginal: excerpt.trim(),
    trustScore: source.trustScore
  };
}

function buildSnippetCandidates(
  sectionId: SectionId,
  input: InputContext,
  documents: SourceDocument[]
): { recencyFilteredCount: number; snippets: EvidenceSnippet[] } {
  const snippets: EvidenceSnippet[] = [];
  let recencyFilteredCount = 0;

  for (const source of documents) {
    const materialActiveRisk = hasMaterialActiveRisk(sectionId, source);
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

  return { recencyFilteredCount, snippets };
}

function scoreAndSelectEvidence(
  sectionId: SectionId,
  nowIso: string,
  snippets: EvidenceSnippet[],
  maxCommunityItems: number,
  maxEvidenceItems: number
): EvidenceSnippet[] {
  const scored = snippets
    .map((snippet) => ({
      ...snippet,
      relevanceScore: scoreSnippet(snippet, sectionId, nowIso)
    }))
    .sort((left, right) => right.relevanceScore - left.relevanceScore);

  return dedupeEvidence(scored, maxCommunityItems).slice(0, maxEvidenceItems);
}

function hasMaterialActiveRisk(sectionId: SectionId, source: SourceDocument): boolean {
  return sectionId === "legal_regulatory" && /active|ongoing|pending|unresolved/i.test(source.text);
}

function sectionKeywords(sectionId: EvidenceSnippet["sectionId"]): string[] {
  switch (sectionId) {
    case "layoffs":
      return ["layoff", "laid off", "restructure", "headcount"];
    case "financial_health":
      return ["funding", "valuation", "revenue", "runway", "profit"];
    case "leadership_stability":
      return ["CEO", "CTO", "leadership", "executive"];
    case "legal_regulatory":
      return ["lawsuit", "settlement", "investigation", "regulator"];
    case "company_culture":
      return ["culture", "management", "toxic", "review"];
    case "work_policy":
      return ["remote", "hybrid", "return to office"];
    case "compensation_benefits":
      return ["salary", "compensation", "equity", "benefits"];
    case "interview_experience":
      return ["interview", "candidate", "offer"];
    case "visa_sponsorship":
      return ["visa", "sponsorship", "work permit"];
    case "product_market_health":
      return ["review", "rating", "customers", "outage"];
    case "company_profile_history":
      return ["founded", "history", "about", "employees"];
    case "founder_background":
      return ["founder", "background", "education", "controversy"];
  }
}

function scoreSnippet(snippet: EvidenceSnippet, sectionId: SectionId, nowIso: string): number {
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

function hashEvidence(evidence: EvidenceSnippet[]): string {
  const hash = createHash("sha256");
  for (const item of evidence) {
    hash.update(JSON.stringify(item));
  }
  return hash.digest("hex");
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function normalizeComplaint(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
