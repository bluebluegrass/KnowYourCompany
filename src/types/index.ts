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
export type SourceTier = "primary" | "authoritative" | "reputable" | "community" | "aggregator";
export type Impact = "blocking" | "material" | "watch" | "informational";
export type EvidenceState = "verified" | "corroborated" | "limited" | "conflicting" | "insufficient";
export type Freshness = "current" | "aging" | "historical" | "unknown";
export type FitState = "aligned" | "investigate" | "mismatch" | "not_applicable";

export interface InputContext {
  company: string;
  location?: string;
  role?: string;
  localLanguage: string;
  outputDir: string;
  now: string;
  candidateProfile?: CandidateProfile;
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
  sourceTier?: SourceTier;
  publisher?: string;
  locationScope?: string;
  accessState?: "fetched" | "partial" | "unavailable";
}

export interface EvidenceSnippet {
  snippetId: string;
  sourceId: string;
  sectionId: SectionId;
  title: string;
  url: string;
  sourceType: SourceType;
  sourceTier?: SourceTier;
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

export interface ModelClaim {
  text: string;
  sourceRefs: string[];
  scope?: ClaimScope;
  impact?: Impact;
  evidenceState?: EvidenceState;
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

export type FinanceCompanyType = "public" | "startup" | "private" | "subsidiary" | "unknown";
export type FinanceTrend = "improving" | "stable" | "worsening" | "mixed" | "unknown";
export type FinanceConfidence = "high" | "medium" | "low";
export type FinanceEventKind = "earnings" | "funding" | "ipo" | "ownership" | "other";

export interface FinanceMetric {
  label: string;
  value: string;
  period?: string;
  trend?: FinanceTrend;
  sourceRefs: string[];
}

export interface FinanceEvent {
  kind: FinanceEventKind;
  title: string;
  detail: string;
  date?: string;
  sourceRefs: string[];
}

export interface FinanceProfile {
  companyType: FinanceCompanyType;
  confidence: FinanceConfidence;
  trend: FinanceTrend;
  sourceRefs: string[];
  metrics: FinanceMetric[];
  events: FinanceEvent[];
  jobSeekerImplications: string[];
  unknowns: string[];
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
  financeProfile?: FinanceProfile;
  ratings: RatingRow[];
  timelineItems: TimelineItem[];
  sourceRefs: string[];
  claims?: ModelClaim[];
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
  location?: string;
  role?: string;
  verdict: FinalSummary;
  sections: SectionAnalysis[];
  sources: Record<string, SourceDocument>;
}

export interface CandidateProfile {
  seniority?: "intern" | "junior" | "mid" | "senior" | "staff_plus" | "manager_plus";
  workAuthorization?: "not_needed" | "needs_employer_sponsorship" | "eligible_independent_route" | "unknown";
  minimumCompensation?: { amount: number; currency: string; period: "year" | "month" };
  workModePreference?: "remote_only" | "hybrid_ok" | "office_ok" | "unknown";
  priorities?: Array<"stability" | "compensation" | "growth" | "culture" | "flexibility" | "visa">;
  dealBreakers?: Array<"no_sponsorship" | "office_required" | "below_min_compensation" | "active_layoffs">;
}

export interface ClaimScope {
  role?: string;
  function?: string;
  level?: string;
  location?: string;
  employmentType?: "employee" | "contractor" | "platform_worker" | "unknown";
}

export interface Claim {
  claimId: string;
  sectionId: SectionId;
  text: string;
  impact: Impact;
  evidenceState: EvidenceState;
  freshness: Freshness;
  sourceRefs: string[];
  scope: ClaimScope;
  candidateFit: FitState;
  fitReason?: string;
  contradictions?: string[];
  actionRefs: string[];
}

export interface ActionItem {
  actionId: string;
  claimId: string;
  priority: 1 | 2 | 3;
  owner: "recruiter" | "hiring_manager" | "future_teammate" | "hr_or_immigration" | "candidate";
  question: string;
  rationale: string;
  resolutionCriteria: string;
}

export interface ReportV2Section {
  sectionId: SectionId;
  title: string;
  summary: string;
  claims: Claim[];
  financePlainLanguage?: string;
  financeProfile?: FinanceProfile;
}

export interface SnapshotDiff {
  previousReportId: string;
  comparedAt: string;
  addedClaimIds: string[];
  removedClaimIds: string[];
  changedClaims: Array<{ claimId: string; changedFields: Array<"impact" | "evidenceState" | "freshness" | "candidateFit" | "sourceRefs">; summary: string }>;
  newActionIds: string[];
}

export interface ReportV2 {
  reportVersion: 2;
  reportId: string;
  generatedAt: string;
  target: { company: string; role?: string; location?: string };
  candidateProfile?: CandidateProfile;
  sources: Record<string, SourceDocument>;
  sections: ReportV2Section[];
  decision: {
    recommendation: "continue" | "continue_after_verification" | "pause" | "insufficient_evidence";
    rationale: string;
    blockingClaimIds: string[];
    topActionIds: string[];
  };
  actions: ActionItem[];
  validationWarnings: string[];
  comparison?: SnapshotDiff;
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
  perStepTokens: Record<string, { in: number; out: number }>;
  perSectionLatencyMs: Record<string, number>;
  perSectionEvidenceSent: Record<string, number>;
  searchCount: Record<string, number>;
  retrievedCount: Record<string, number>;
  dedupedCount: Record<string, number>;
}
