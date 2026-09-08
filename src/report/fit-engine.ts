import type { CandidateProfile, Claim, FitState } from "../types/index.js";

export function fitClaims(claims: Claim[], profile?: CandidateProfile): Claim[] {
  if (!profile) return claims.map((claim) => ({ ...claim, candidateFit: "not_applicable" }));
  return claims.map((claim) => fitClaim(claim, profile));
}

function fitClaim(claim: Claim, profile: CandidateProfile): Claim {
  const text = claim.text.toLowerCase();
  const requiresOffice = /in[ -]?office|office.{0,30}(required|days)|return to office|rto/.test(text);
  const sponsorshipUnavailable = /no visa|does not sponsor|without sponsorship|must.*right to work/.test(text);
  const activeLayoff = claim.sectionId === "layoffs" && /layoff|reduction|restructure/.test(text) && claim.freshness !== "historical";
  if (profile.workModePreference === "remote_only" && requiresOffice) return withFit(claim, "mismatch", "This role appears to require office attendance, which conflicts with a remote-only preference.");
  if (profile.workAuthorization === "needs_employer_sponsorship" && claim.sectionId === "visa_sponsorship") {
    return sponsorshipUnavailable ? withFit(claim, "mismatch", "The available evidence indicates sponsorship may not be available for this role.") : withFit(claim, "investigate", "Sponsorship needs confirmation for this specific role and location.");
  }
  if (profile.dealBreakers?.includes("active_layoffs") && activeLayoff) return withFit(claim, "investigate", "Recent layoff information conflicts with the stated stability requirement and should be verified.");
  if (profile.priorities?.includes("stability") && activeLayoff) return withFit(claim, "investigate", "This recent stability signal is relevant to the candidate's priorities.");
  return claim;
}

function withFit(claim: Claim, candidateFit: FitState, fitReason: string): Claim {
  return { ...claim, candidateFit, fitReason };
}
