import type { ReportV2, SnapshotDiff } from "../types/index.js";

export function compareReports(current: ReportV2, previous: ReportV2): SnapshotDiff {
  if (current.target.company.toLowerCase() !== previous.target.company.toLowerCase() || !sameOptional(current.target.location, previous.target.location) || !sameOptional(current.target.role, previous.target.role)) {
    throw new Error("Reports can only be compared when company, role, and location match.");
  }
  const currentClaims = new Map(current.sections.flatMap((section) => section.claims).map((claim) => [claim.claimId, claim]));
  const previousClaims = new Map(previous.sections.flatMap((section) => section.claims).map((claim) => [claim.claimId, claim]));
  const addedClaimIds = [...currentClaims.keys()].filter((id) => !previousClaims.has(id));
  const removedClaimIds = [...previousClaims.keys()].filter((id) => !currentClaims.has(id));
  const changedClaims = [...currentClaims.entries()].flatMap(([claimId, claim]) => {
    const old = previousClaims.get(claimId);
    if (!old) return [];
    const changedFields = (["impact", "evidenceState", "freshness", "candidateFit", "sourceRefs"] as const).filter((field) => JSON.stringify(claim[field]) !== JSON.stringify(old[field]));
    return changedFields.length ? [{ claimId, changedFields, summary: `Updated ${changedFields.join(", ")}.` }] : [];
  });
  const priorActions = new Set(previous.actions.map((action) => action.actionId));
  return { previousReportId: previous.reportId, comparedAt: current.generatedAt, addedClaimIds, removedClaimIds, changedClaims, newActionIds: current.actions.map((action) => action.actionId).filter((id) => !priorActions.has(id)) };
}

function sameOptional(left?: string, right?: string): boolean { return (left || "").trim().toLowerCase() === (right || "").trim().toLowerCase(); }
