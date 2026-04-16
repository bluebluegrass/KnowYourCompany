export type SectionId =
  | "layoffs"
  | "financial_health"
  | "leadership_stability"
  | "legal_regulatory"
  | "company_culture"
  | "work_policy"
  | "compensation_benefits"
  | "interview_experience"
  | "visa_sponsorship"
  | "product_market_health"
  | "company_profile_history"
  | "founder_background";

export type Severity = "green" | "yellow" | "red" | "grey";

export interface InputContext {
  company: string;
  location?: string;
  role?: string;
  outputLanguage: string;
  localLanguage: string;
  canonicalLanguage: string;
  outputDir: string;
  now: string;
}

export interface QueryPlan {
  sectionId: SectionId;
  query: string;
  language: string;
  priority: number;
  recencyMonths?: number;
  reason: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  discoveredAt: string;
  language: string;
}

export type SourceType =
  | "official"
  | "news"
  | "community"
  | "government"
  | "directory"
  | "review"
  | "unknown";

export interface SourceDocument {
  url: string;
  normalizedUrl: string;
  title: string;
  fetchedAt: string;
  discoveredAt?: string;
  language: string;
  html: string;
  text: string;
  sourceType: SourceType;
  publishedAt?: string;
  trustScore: number;
}

export interface EvidenceSnippet {
  snippetId: string;
  sourceId: string;
  sectionId: SectionId;
  title: string;
  url: string;
  sourceType: SourceType;
  sourceLanguage: string;
  translated: boolean;
  publishedAt?: string;
  fetchedAt: string;
  excerptOriginal: string;
  excerptCanonical: string;
  trustScore: number;
  relevanceScore: number;
  includedViaException: boolean;
  inclusionReason: string;
}

export interface EvidencePacket {
  sectionId: SectionId;
  company: string;
  role?: string;
  location?: string;
  canonicalLanguage: string;
  evidenceHash: string;
  evidence: EvidenceSnippet[];
  stats: {
    queryCount: number;
    retrievedCount: number;
    recencyFilteredCount: number;
    sentToModelCount: number;
  };
}

export interface Finding {
  text: string;
  sourceRefs: string[];
}

export interface RatingRow {
  label: string;
  value: string;
  stars?: string;
}

export interface TimelineItem {
  title: string;
  meta: string;
}

export interface SectionAnalysis {
  sectionId: SectionId;
  severity: Severity;
  badgeLabelKey: "no_concerns" | "mixed_signals" | "concern_found" | "no_data";
  title: string;
  summaryText: string;
  keyFindings: Finding[];
  disclaimers: string[];
  plainEnglishFinanceText?: string;
  ratings: RatingRow[];
  timelineItems: TimelineItem[];
  sourceRefs: string[];
  translatedSourceLabels: string[];
}

export interface VerdictFlag {
  tone: Severity;
  text: string;
}

export interface FinalSummary {
  verdictText: string;
  verdictFlags: VerdictFlag[];
}

export interface ReportModel {
  company: string;
  date: string;
  outputLanguage: string;
  location?: string;
  role?: string;
  verdict: FinalSummary;
  sections: SectionAnalysis[];
  sources: Record<string, SourceDocument>;
}

export interface CacheEntry<T> {
  storedAt: string;
  version: string;
  value: T;
}

export interface RunMetrics {
  cacheHits: Record<string, number>;
  cacheMisses: Record<string, number>;
  tokensIn: number;
  tokensOut: number;
  perSectionLatencyMs: Record<string, number>;
  perSectionEvidenceSent: Record<string, number>;
  searchCount: Record<string, number>;
  retrievedCount: Record<string, number>;
  dedupedCount: Record<string, number>;
}
