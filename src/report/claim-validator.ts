import { defaultEvidenceState, EVIDENCE_POLICIES, freshnessFor, maxImpactFor, tierSupports } from "../config/evidence-policy.js";
import type { Claim, EvidenceState, Impact, SectionId, SourceDocument } from "../types/index.js";

export interface ValidationResult { claims: Claim[]; warnings: string[]; }

const impactRank: Record<Impact, number> = { informational: 0, watch: 1, material: 2, blocking: 3 };

export function validateClaims(claims: Claim[], sources: Record<string, SourceDocument>, nowIso: string): ValidationResult {
  const warnings: string[] = [];
  const valid: Claim[] = [];
  for (const claim of claims) {
    const refs = claim.sourceRefs.filter((id) => Boolean(sources[id]));
    if (!refs.length) {
      warnings.push(`${claim.claimId}: removed because it has no registered sources`);
      continue;
    }
    const policy = EVIDENCE_POLICIES[claim.sectionId];
    const sourceFreshness = refs.map((id) => freshnessFor(sources[id]!, claim.sectionId, nowIso));
    const freshness = sourceFreshness.includes("current") ? "current" : sourceFreshness.includes("aging") ? "aging" : sourceFreshness.includes("historical") ? "historical" : "unknown";
    const supportedImpact = maxImpactFor(refs, sources, claim.sectionId);
    const requestedImpact = impactRank[claim.impact] > impactRank[supportedImpact] ? supportedImpact : claim.impact;
    const evidenceState: EvidenceState = claim.evidenceState === "conflicting" ? "conflicting" : defaultEvidenceState(refs, sources, claim.sectionId);
    const hasStrong = refs.some((id) => tierSupports(sources[id]!.sourceTier, policy.minimumTierForMaterial));
    if ((requestedImpact === "material" || requestedImpact === "blocking") && !hasStrong) {
      warnings.push(`${claim.claimId}: downgraded because only weak sources support a high-impact claim`);
    }
    valid.push({ ...claim, sourceRefs: refs, impact: requestedImpact, evidenceState, freshness });
  }
  return { claims: valid, warnings };
}

export function validateTargetScope(claim: Claim, target: { role?: string; location?: string }): Claim {
  const locationMismatch = claim.scope.location && target.location && !claim.scope.location.toLowerCase().includes(target.location.toLowerCase()) && !target.location.toLowerCase().includes(claim.scope.location.toLowerCase());
  const roleMismatch = claim.scope.role && target.role && !claim.scope.role.toLowerCase().includes(target.role.toLowerCase()) && !target.role.toLowerCase().includes(claim.scope.role.toLowerCase());
  return locationMismatch || roleMismatch ? { ...claim, candidateFit: "not_applicable", fitReason: "The available evidence applies to a different role or location." } : claim;
}
