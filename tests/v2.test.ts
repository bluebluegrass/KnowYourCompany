import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildActions } from "../src/report/action-engine.js";
import { validateClaims } from "../src/report/claim-validator.js";
import { buildDecision } from "../src/report/decision-engine.js";
import { fitClaims } from "../src/report/fit-engine.js";
import { compareReports } from "../src/report/snapshot-diff.js";
import { createReportV2 } from "../src/report/v2-report.js";
import { renderReportV2 } from "../src/render/v2-renderer.js";
import { renderFromJson } from "../src/render/report-renderer.js";
import type { Claim, ReportV2, SourceDocument } from "../src/types/index.js";

const source = (id: string, tier: NonNullable<SourceDocument["sourceTier"]>): SourceDocument => ({
  url: id === "official" ? "https://careers.example.com/role" : "https://reddit.example.com/thread",
  normalizedUrl: id,
  title: id,
  fetchedAt: "2026-09-06T00:00:00.000Z",
  language: "en",
  html: "",
  text: "",
  sourceType: tier === "community" ? "community" : "official",
  sourceTier: tier,
  publishedAt: "2026-08-20T00:00:00.000Z",
  trustScore: 0.9
});

const claim = (overrides: Partial<Claim> = {}): Claim => ({
  claimId: "work_policy:hybrid:1",
  sectionId: "work_policy",
  text: "This role requires two in-office days each week.",
  impact: "material",
  evidenceState: "verified",
  freshness: "current",
  sourceRefs: ["official"],
  scope: { location: "Amsterdam", role: "Engineer", employmentType: "employee" },
  candidateFit: "not_applicable",
  actionRefs: [],
  ...overrides
});

test("claim validator removes claims without registered evidence and downgrades weak evidence", () => {
  const sources = { official: source("official", "primary"), community: source("community", "community") };
  const result = validateClaims([
    claim({ claimId: "missing", sourceRefs: ["gone"] }),
    claim({ claimId: "weak", impact: "blocking", sourceRefs: ["community"] })
  ], sources, "2026-09-06T00:00:00.000Z");
  assert.equal(result.claims.length, 1);
  assert.equal(result.claims[0]!.impact, "watch");
  assert.match(result.warnings.join("\n"), /missing/);
});

test("fit and action engines turn a remote-only mismatch into a recruiter question", () => {
  const fitted = fitClaims([claim()], { workModePreference: "remote_only" });
  assert.equal(fitted[0]!.candidateFit, "mismatch");
  const actions = buildActions(fitted);
  assert.equal(actions.length, 1);
  assert.match(actions[0]!.question, /working arrangement/i);
  assert.equal(buildDecision(fitted, actions, { workModePreference: "remote_only" }).recommendation, "pause");
});

test("snapshot comparison detects state changes without treating the same claim as new", () => {
  const base = makeReport("current");
  const current = makeReport("aging");
  const diff = compareReports(current, base);
  assert.deepEqual(diff.addedClaimIds, []);
  assert.equal(diff.changedClaims[0]!.claimId, "work_policy:hybrid:1");
  assert.ok(diff.changedClaims[0]!.changedFields.includes("freshness"));
});

test("v2 renderer escapes claim text and blocks unsafe URLs", () => {
  const report = makeReport("current");
  report.sections[0]!.claims[0]!.text = "<script>alert(1)</script>";
  report.sources.official!.url = "javascript:alert(1)";
  const html = renderReportV2(report);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test("v2 renderer provides a section table of contents for the visible research section", () => {
  const html = renderReportV2(makeReport("current"));
  assert.match(html, /class="section-toc"/);
  assert.match(html, /aria-label="Research sections"/);
  assert.match(html, /href="#section-work_policy"/);
  assert.match(html, /id="all-research"/);
  assert.doesNotMatch(html, /Open research|appendix\.open|<details class="all-research"/);
});

test("renderFromJson routes the current JSON artifact to the current renderer", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "bg-check-render-"));
  const jsonPath = path.join(tempDir, "Example_KnowYourCompany_2026-09-06.report.json");
  await writeFile(jsonPath, `${JSON.stringify(makeReport("current"))}\n`, "utf8");
  const result = await renderFromJson(jsonPath);
  assert.match(result.outputPath, /\.html$/);
  assert.doesNotMatch(result.outputPath, /\.v2\.html$/);
  assert.equal(await readFile(result.outputPath, "utf8"), result.html);
  assert.match(result.html, /continue/);
});

test("v2 report uses model-native claims when they are available", () => {
  const analysis = {
    company: "Example",
    sources: { official: source("official", "primary") },
    sections: [{
      sectionId: "work_policy" as const,
      title: "Work policy",
      summaryText: "Summary",
      claims: [{ text: "Model claim", sourceRefs: ["official"], impact: "material" as const }],
      sourceRefs: ["official"]
    }]
  };
  const report = createReportV2(analysis, { company: "Example", localLanguage: "en", outputDir: "/tmp", now: "2026-09-06T00:00:00.000Z" });
  assert.equal(report.sections[0]!.claims[0]!.text, "Model claim");
});

function makeReport(freshness: Claim["freshness"]): ReportV2 {
  const item = claim({ freshness });
  return {
    reportVersion: 2,
    reportId: freshness === "current" ? "previous" : "current",
    generatedAt: "2026-09-06T00:00:00.000Z",
    target: { company: "Example", role: "Engineer", location: "Amsterdam" },
    sources: { official: source("official", "primary") },
    sections: [{ sectionId: "work_policy", title: "Work policy", summary: "Summary", claims: [item] }],
    decision: { recommendation: "continue", rationale: "ok", blockingClaimIds: [], topActionIds: [] },
    actions: [],
    validationWarnings: []
  };
}
