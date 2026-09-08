import type { EvidenceState, Freshness, Impact, SectionId, SourceDocument, SourceTier } from "../types/index.js";

export interface EvidencePolicy {
  currentMonths?: number;
  agingMonths?: number;
  minimumTierForMaterial: SourceTier;
  allowCommunityForMaterial: boolean;
}

const DYNAMIC: EvidencePolicy = { currentMonths: 6, agingMonths: 12, minimumTierForMaterial: "reputable", allowCommunityForMaterial: false };
const STANDARD: EvidencePolicy = { currentMonths: 12, agingMonths: 24, minimumTierForMaterial: "reputable", allowCommunityForMaterial: false };

export const EVIDENCE_POLICIES: Record<SectionId, EvidencePolicy> = {
  layoffs: DYNAMIC,
  financial_health: { currentMonths: 12, agingMonths: 24, minimumTierForMaterial: "primary", allowCommunityForMaterial: false },
  leadership_stability: STANDARD,
  legal_regulatory: { minimumTierForMaterial: "authoritative", allowCommunityForMaterial: false },
  company_culture: { currentMonths: 12, agingMonths: 24, minimumTierForMaterial: "reputable", allowCommunityForMaterial: false },
  work_policy: DYNAMIC,
  compensation_benefits: DYNAMIC,
  interview_experience: DYNAMIC,
  visa_sponsorship: DYNAMIC,
  product_market_health: STANDARD,
  company_profile_history: { minimumTierForMaterial: "reputable", allowCommunityForMaterial: false },
  founder_background: STANDARD
};

const TIER_RANK: Record<SourceTier, number> = { aggregator: 0, community: 1, reputable: 2, authoritative: 3, primary: 4 };

export function tierSupports(tier: SourceTier | undefined, minimum: SourceTier): boolean {
  return TIER_RANK[tier || "aggregator"] >= TIER_RANK[minimum];
}

export function freshnessFor(source: SourceDocument, sectionId: SectionId, nowIso: string): Freshness {
  if (!source.publishedAt) return "unknown";
  const policy = EVIDENCE_POLICIES[sectionId];
  if (!policy.currentMonths || !policy.agingMonths) return "historical";
  const ageMonths = Math.max(0, (new Date(nowIso).getTime() - new Date(source.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
  if (ageMonths <= policy.currentMonths) return "current";
  if (ageMonths <= policy.agingMonths) return "aging";
  return "historical";
}

export function defaultEvidenceState(sourceRefs: string[], sources: Record<string, SourceDocument>, sectionId: SectionId): EvidenceState {
  if (!sourceRefs.length) return "insufficient";
  const tiers = sourceRefs.map((id) => sources[id]?.sourceTier || "aggregator");
  const strong = tiers.filter((tier) => tierSupports(tier, EVIDENCE_POLICIES[sectionId].minimumTierForMaterial));
  return strong.length >= 2 ? "corroborated" : strong.length === 1 ? "verified" : "limited";
}

export function maxImpactFor(sourceRefs: string[], sources: Record<string, SourceDocument>, sectionId: SectionId): Impact {
  const policy = EVIDENCE_POLICIES[sectionId];
  const strong = sourceRefs.filter((id) => tierSupports(sources[id]?.sourceTier, policy.minimumTierForMaterial));
  if (strong.length >= 2) return "blocking";
  if (strong.length === 1) return "material";
  return sourceRefs.length ? "watch" : "informational";
}
