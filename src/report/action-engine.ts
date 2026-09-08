import type { ActionItem, Claim } from "../types/index.js";

export function buildActions(claims: Claim[]): ActionItem[] {
  const candidates = claims
    .filter((claim) => claim.candidateFit === "mismatch" || claim.candidateFit === "investigate" || claim.evidenceState === "conflicting" || claim.impact === "blocking" || claim.impact === "material")
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, 3);
  return candidates.map((claim, index) => actionFor(claim, (index + 1) as 1 | 2 | 3));
}

function rank(claim: Claim): number {
  return (claim.candidateFit === "mismatch" ? 100 : 0) + (claim.impact === "blocking" ? 60 : claim.impact === "material" ? 40 : 0) + (claim.evidenceState === "conflicting" ? 20 : 0);
}

function actionFor(claim: Claim, priority: 1 | 2 | 3): ActionItem {
  const owner = claim.sectionId === "visa_sponsorship" ? "hr_or_immigration" : claim.sectionId === "interview_experience" || claim.sectionId === "work_policy" ? "hiring_manager" : "recruiter";
  const question = questionFor(claim);
  return {
    actionId: `action:${claim.claimId}`,
    claimId: claim.claimId,
    priority,
    owner,
    question,
    rationale: claim.fitReason || "This is a material or unresolved public signal that can be clarified during the hiring process.",
    resolutionCriteria: "Receive a specific, role- and location-relevant answer from the appropriate company representative."
  };
}

function questionFor(claim: Claim): string {
  switch (claim.sectionId) {
    case "visa_sponsorship": return "For this specific role and location, is employer sponsorship available, and who owns the process and timeline?";
    case "work_policy": return "What is the current working arrangement for this team, and is the expectation expected to change in the next 12 months?";
    case "layoffs": return "How have the team's headcount and priorities changed over the past 12 months, and is this position new or a backfill?";
    case "compensation_benefits": return "Could you share the compensation range and how base pay, variable compensation, and equity are determined for this level and location?";
    case "leadership_stability": return "What changes in team priorities or reporting lines should the person in this role expect over the next year?";
    default: return "Could you help me understand how this public signal applies to this specific team, role, and location?";
  }
}
