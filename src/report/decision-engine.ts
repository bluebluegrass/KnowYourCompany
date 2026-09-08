import type { ActionItem, CandidateProfile, Claim, ReportV2 } from "../types/index.js";

export function buildDecision(claims: Claim[], actions: ActionItem[], profile?: CandidateProfile): ReportV2["decision"] {
  const blocking = claims.filter((claim) => claim.candidateFit === "mismatch" && (claim.evidenceState === "verified" || claim.evidenceState === "corroborated"));
  const investigate = claims.filter((claim) => claim.candidateFit === "investigate" || claim.evidenceState === "conflicting");
  const recommendation = blocking.length ? "pause" : !claims.length ? "insufficient_evidence" : investigate.length ? "continue_after_verification" : "continue";
  const rationale = recommendation === "pause"
    ? "A verified public signal conflicts with a stated deal-breaker."
    : recommendation === "continue_after_verification"
      ? "No verified blocking issue was found, but the listed items should be confirmed before investing further interview time."
      : recommendation === "insufficient_evidence"
        ? "Public evidence was insufficient to make a role-specific recommendation."
        : profile ? "No verified public signal conflicts with the supplied priorities." : "No verified high-impact public concern was identified in the available evidence.";
  return { recommendation, rationale, blockingClaimIds: blocking.map((claim) => claim.claimId), topActionIds: actions.map((action) => action.actionId) };
}
