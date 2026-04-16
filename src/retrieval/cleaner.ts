import type { EvidenceSnippet, SourceDocument } from "../types/index.js";
import { hashContent } from "./fetcher.js";

export function extractRelevantSnippet(
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
