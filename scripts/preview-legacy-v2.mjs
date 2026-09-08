import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildActions } from "../dist/src/report/action-engine.js";
import { buildClaimId } from "../dist/src/report/claim-id.js";
import { buildDecision } from "../dist/src/report/decision-engine.js";
import { fitClaims } from "../dist/src/report/fit-engine.js";
import { sourceMetadata, trustScoreForTier } from "../dist/src/evidence/source-metadata.js";
import { renderFromJson } from "../dist/src/render/report-renderer.js";

const SECTION_MAP = [
  ["layoffs", "Recent layoffs", "LAYOFFS_CONTENT", "LAYOFFS_SOURCES", "B1"],
  ["financial_health", "Financial health", "FINANCIAL_SIGNALS", "FINANCIAL_SOURCES", "B2"],
  ["leadership_stability", "Leadership stability", "LEADERSHIP_CURRENT", "LEADERSHIP_SOURCES", "B3"],
  ["legal_regulatory", "Legal & regulatory", "LEGAL_CONTENT", "LEGAL_SOURCES", "B4"],
  ["company_culture", "Company culture", "CULTURE_THEMES", "CULTURE_SOURCES", "B5"],
  ["work_policy", "Remote / hybrid / RTO", "RTO_OFFICIAL", "RTO_SOURCES", "B6"],
  ["compensation_benefits", "Compensation & benefits", "COMP_SALARY", "COMP_SOURCES", "B7"],
  ["interview_experience", "Interview experience", "INTERVIEW_CONTENT", "INTERVIEW_SOURCES", "B8"],
  ["visa_sponsorship", "Visa sponsorship", "VISA_CONTENT", "VISA_SOURCES", "B9"],
  ["product_market_health", "Product & market health", "PRODUCT_CONTENT", "PRODUCT_SOURCES", "B10"],
  ["company_profile_history", "Company profile & history", "PROFILE_SUMMARY", "PROFILE_SOURCES", "B11"],
  ["founder_background", "Founder background", "FOUNDER_CONTENT", "FOUNDER_SOURCES", "B12"]
].map(([id, title, contentKey, sourceKey, badgeKey]) => ({ id, title, contentKey, sourceKey, badgeKey }));

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: node scripts/preview-legacy-v2.mjs <legacy.report.json>");
}
const options = new Set(process.argv.slice(3));
const candidateProfile = {
  ...(options.has("--remote-only") ? { workModePreference: "remote_only" } : {}),
  ...(options.has("--needs-sponsorship") ? { workAuthorization: "needs_employer_sponsorship" } : {})
};

const legacy = JSON.parse(await readFile(inputPath, "utf8"));
const generatedAt = new Date().toISOString();
const target = {
  company: legacy.COMPANY || "Unknown company",
  ...(legacy.ROLE ? { role: legacy.ROLE } : {}),
  ...(legacy.LOCATION ? { location: legacy.LOCATION } : {})
};
const sources = {};
const sections = SECTION_MAP.map((definition) => {
  const content = textFromHtml(legacy[definition.contentKey] || "");
  const sourceRefs = registerSources(legacy[definition.sourceKey] || "", sources, generatedAt);
  const scope = { ...(target.role ? { role: target.role } : {}), ...(target.location ? { location: target.location } : {}), employmentType: "unknown" };
  const text = content.slice(0, 1200);
  const impact = impactFor(legacy[definition.badgeKey]);
  const claim = text ? {
    claimId: buildClaimId(definition.id, text, scope),
    sectionId: definition.id,
    text,
    impact,
    evidenceState: sourceRefs.length >= 2 ? "corroborated" : sourceRefs.length ? "limited" : "insufficient",
    freshness: "unknown",
    sourceRefs,
    scope,
    candidateFit: "not_applicable",
    actionRefs: []
  } : undefined;
  return { sectionId: definition.id, title: definition.title, summary: legacyBrief(content, impact), claims: claim ? [claim] : [] };
});
const claims = fitClaims(sections.flatMap((section) => section.claims), Object.keys(candidateProfile).length ? candidateProfile : undefined);
for (const section of sections) section.claims = claims.filter((claim) => claim.sectionId === section.sectionId);
const actions = buildActions(claims);
for (const claim of claims) claim.actionRefs = actions.filter((action) => action.claimId === claim.claimId).map((action) => action.actionId);
const report = {
  reportVersion: 2,
  reportId: `legacy-preview-${Date.now()}`,
  generatedAt,
  target,
  ...(Object.keys(candidateProfile).length ? { candidateProfile } : {}),
  sources,
  sections,
  decision: buildDecision(claims, actions),
  actions,
  validationWarnings: ["Offline legacy preview: content and sources were reused from a prior report. No web search or model call was made."]
};
const outputPath = inputPath.replace(/\.report\.json$/, ".v2.report.json");
if (outputPath === inputPath) throw new Error("Input filename must end in .report.json.");
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const rendered = await renderFromJson(outputPath);
console.log(`JSON saved: ${outputPath}`);
console.log(`HTML saved: ${rendered.outputPath}`);

function registerSources(html, registry, fetchedAt) {
  const refs = [];
  const pattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const url = match[1];
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const sourceId = `legacy:${refs.length}:${url}`;
    const metadata = sourceMetadata(url);
    registry[sourceId] = {
      url,
      normalizedUrl: url,
      title: textFromHtml(match[2]) || new URL(url).hostname,
      fetchedAt,
      language: "unknown",
      html: "",
      text: "",
      ...metadata,
      trustScore: trustScoreForTier(metadata.sourceTier || "aggregator")
    };
    refs.push(sourceId);
  }
  return refs;
}

function textFromHtml(value) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function impactFor(badge) {
  if (badge === "red") return "material";
  if (badge === "yellow") return "watch";
  return "informational";
}

function legacyBrief(content, impact) {
  const text = String(content).replace(/\s+/g, " ").trim();
  if (!text) return "No public information was retained for this area.";
  const appointment = text.match(/([A-Z][A-Za-z ]+) — ([^(]+\(appointed[^)]+\))/);
  if (text.startsWith("As of ") && appointment) return `Current leadership includes ${appointment[1].trim()} — ${appointment[2].trim()}.`;
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((sentence) => sentence.trim()).filter(Boolean);
  if (!sentences.length) return text;
  const scored = sentences.map((sentence, index) => ({ sentence, score: briefScore(sentence, impact, index) }));
  return scored.sort((a, b) => b.score - a.score)[0].sentence;
}

function briefScore(sentence, impact, index) {
  const value = sentence.toLowerCase();
  const concernWords = /toxic|turnover|pressure|instability|layoff|termination|red flag|fired|fraud|unconfirmed|could not|no specific|below market|poor communication|ghosting|disorganised|departure|three ceos/;
  const hardUncertainty = /unconfirmed|could not|no specific/;
  const uncertaintyWords = /however|but |mixed|unclear|no active|no specific|could not|unconfirmed|recommendation/;
  const signal = concernWords.test(value) ? 40 : uncertaintyWords.test(value) ? 25 : 0;
  const severity = impact === "material" ? signal : impact === "watch" ? Math.round(signal / 2) : hardUncertainty.test(value) ? signal : 0;
  const lengthBonus = sentence.length <= 360 ? 8 : 0;
  return severity + lengthBonus - index;
}
