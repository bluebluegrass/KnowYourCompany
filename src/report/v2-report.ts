import { createHash } from "node:crypto";
import { defaultEvidenceState, maxImpactFor } from "../config/evidence-policy.js";
import type { Claim, FinanceProfile, InputContext, ModelClaim, ReportModel, ReportV2, SectionAnalysis, SourceDocument } from "../types/index.js";
import { buildActions } from "./action-engine.js";
import { buildClaimId } from "./claim-id.js";
import { validateClaims, validateTargetScope } from "./claim-validator.js";
import { buildDecision } from "./decision-engine.js";
import { fitClaims } from "./fit-engine.js";

export function createReportV2(legacy: ReportModel, context: InputContext): ReportV2 {
  const rawClaims = legacy.sections.flatMap((section) => claimsForSection(section, legacy.sources, context));
  const validated = validateClaims(rawClaims, legacy.sources, context.now);
  const targetScope = { ...(context.role ? { role: context.role } : {}), ...(context.location ? { location: context.location } : {}) };
  const scoped = validated.claims.map((claim) => validateTargetScope(claim, targetScope));
  const fitted = fitClaims(scoped, context.candidateProfile);
  const actions = buildActions(fitted);
  const actioned = fitted.map((claim) => ({ ...claim, actionRefs: actions.filter((action) => action.claimId === claim.claimId).map((action) => action.actionId) }));
  const reportId = createHash("sha256").update(`${legacy.company}|${context.role || ""}|${context.location || ""}|${context.now}`).digest("hex").slice(0, 16);
  const decision = buildDecision(actioned, actions, context.candidateProfile);
  return {
    reportVersion: 2,
    reportId,
    generatedAt: context.now,
    target: { company: legacy.company, ...(legacy.role ? { role: legacy.role } : {}), ...(legacy.location ? { location: legacy.location } : {}) },
    ...(context.candidateProfile ? { candidateProfile: context.candidateProfile } : {}),
    sources: legacy.sources,
    sections: legacy.sections.map((section) => {
      const financeProfile = section.sectionId === "financial_health" && section.financeProfile
        ? retainFinanceProfile(section.financeProfile, legacy.sources)
        : undefined;
      return {
        sectionId: section.sectionId,
        title: section.title,
        summary: section.summaryText,
        claims: actioned.filter((claim) => claim.sectionId === section.sectionId),
        ...(section.sectionId === "financial_health" && section.plainEnglishFinanceText?.trim()
          ? { financePlainLanguage: section.plainEnglishFinanceText.trim() }
          : {}),
        ...(financeProfile ? { financeProfile } : {})
      };
    }),
    decision,
    actions,
    validationWarnings: validated.warnings
  };
}

function retainFinanceProfile(profile: FinanceProfile, sources: Record<string, SourceDocument>): FinanceProfile | undefined {
  const registered = (refs: string[]) => refs.filter((ref) => Boolean(sources[ref]));
  const metrics = profile.metrics
    .map((metric) => ({ ...metric, sourceRefs: registered(metric.sourceRefs) }))
    .filter((metric) => metric.sourceRefs.length);
  const events = profile.events
    .map((event) => ({ ...event, sourceRefs: registered(event.sourceRefs) }))
    .filter((event) => event.sourceRefs.length);
  const sourceRefs = [...new Set([...registered(profile.sourceRefs), ...metrics.flatMap((metric) => metric.sourceRefs), ...events.flatMap((event) => event.sourceRefs)])];
  if (!sourceRefs.length) return undefined;
  return { ...profile, sourceRefs, metrics, events };
}


function claimsForSection(section: SectionAnalysis, sources: Record<string, SourceDocument>, context: InputContext): Claim[] {
  const findings: ModelClaim[] = section.claims?.length ? section.claims : (section.keyFindings.length ? section.keyFindings : [{ text: section.summaryText, sourceRefs: section.sourceRefs }]);
  return findings.filter((finding) => finding.text.trim()).map((finding) => {
    const scope = { ...(context.role ? { role: context.role } : {}), ...(context.location ? { location: context.location } : {}), employmentType: "unknown" as const, ...(finding.scope || {}) };
    const sourceRefs = finding.sourceRefs.length ? finding.sourceRefs : section.sourceRefs;
    const text = finding.text.trim();
    return {
      claimId: buildClaimId(section.sectionId, text, scope),
      sectionId: section.sectionId,
      text,
      impact: finding.impact || maxImpactFor(sourceRefs, sources, section.sectionId),
      evidenceState: finding.evidenceState || defaultEvidenceState(sourceRefs, sources, section.sectionId),
      freshness: "unknown",
      sourceRefs,
      scope,
      candidateFit: "not_applicable",
      actionRefs: []
    };
  });
}
