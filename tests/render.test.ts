import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { renderFromJson, renderReport } from "../src/render/report-renderer.js";
import type { ReportModel } from "../src/types/index.js";

async function fixtureTemplate() {
  const root = process.cwd();
  const [template, styles] = await Promise.all([
    readFile(path.join(root, "references", "template.html"), "utf8"),
    readFile(path.join(root, "references", "styles.css"), "utf8")
  ]);
  return { template, styles };
}

test("renderer removes placeholders and stays offline-safe", async () => {
  const { template, styles } = await fixtureTemplate();
  const report: ReportModel = {
    company: "Acme",
    date: "2026-04-16",
    verdict: {
      verdictText: "Mixed picture overall.",
      verdictFlags: [{ tone: "yellow", text: "Limited interview signal" }]
    },
    sections: Array.from({ length: 12 }, (_, index) => ({
      sectionId: [
        "layoffs",
        "financial_health",
        "leadership_stability",
        "legal_regulatory",
        "company_culture",
        "work_policy",
        "compensation_benefits",
        "interview_experience",
        "visa_sponsorship",
        "product_market_health",
        "company_profile_history",
        "founder_background"
      ][index] as ReportModel["sections"][number]["sectionId"],
      severity: "grey" as const,
      badgeLabelKey: "no_data" as const,
      title: `Section ${index + 1}`,
      summaryText: "No data found for this section.",
      keyFindings: [],
      disclaimers: [],
      ratings: [],
      timelineItems: [],
      sourceRefs: []
    })),
    sources: {}
  };
  const html = renderReport(template, styles, report);
  assert.equal(/\{\{[^}]+\}\}/.test(html), false);
  assert.equal(/https:\/\/fonts\.googleapis\.com/i.test(html), false);
});

test("renderer never invents URLs", async () => {
  const { template, styles } = await fixtureTemplate();
  const report: ReportModel = {
    company: "Acme",
    date: "2026-04-16",
    verdict: { verdictText: "Safe enough.", verdictFlags: [] },
    sections: [
      {
        sectionId: "layoffs",
        severity: "green" as const,
        badgeLabelKey: "no_concerns" as const,
        title: "Recent Layoffs",
        summaryText: "No layoffs found.",
        keyFindings: [],
        disclaimers: [],
        ratings: [],
        timelineItems: [],
        sourceRefs: ["https://example.com/source"]
      },
      ...Array.from({ length: 11 }, (_, index) => ({
        sectionId: [
          "financial_health",
          "leadership_stability",
          "legal_regulatory",
          "company_culture",
          "work_policy",
          "compensation_benefits",
          "interview_experience",
          "visa_sponsorship",
          "product_market_health",
          "company_profile_history",
          "founder_background"
        ][index] as ReportModel["sections"][number]["sectionId"],
        severity: "grey" as const,
        badgeLabelKey: "no_data" as const,
        title: "Fallback",
        summaryText: "No data found for this section.",
        keyFindings: [],
        disclaimers: [],
        ratings: [],
        timelineItems: [],
        sourceRefs: [],
        translatedSourceLabels: []
      }))
    ],
    sources: {
      "https://example.com/source": {
        url: "https://example.com/source",
        normalizedUrl: "https://example.com/source",
        title: "Example source",
        fetchedAt: "2026-04-16T00:00:00.000Z",
        language: "en",
        html: "",
        text: "",
        sourceType: "official",
        trustScore: 1
      }
    }
  };
  const html = renderReport(template, styles, report);
  assert.equal(html.includes("https://example.com/source"), true);
  assert.equal(html.includes("https://invented.example"), false);
});

test("renderFromJson writes deterministic HTML next to the JSON artifact", async () => {
  const report: ReportModel = {
    company: "Acme Labs",
    date: "2026-04-17",
    location: "Amsterdam",
    verdict: {
      verdictText: "Mixed picture overall.",
      verdictFlags: [{ tone: "yellow", text: "Some signals need follow-up" }]
    },
    sections: Array.from({ length: 12 }, (_, index) => ({
      sectionId: [
        "layoffs",
        "financial_health",
        "leadership_stability",
        "legal_regulatory",
        "company_culture",
        "work_policy",
        "compensation_benefits",
        "interview_experience",
        "visa_sponsorship",
        "product_market_health",
        "company_profile_history",
        "founder_background"
      ][index] as ReportModel["sections"][number]["sectionId"],
      severity: "grey" as const,
      badgeLabelKey: "no_data" as const,
      title: `Section ${index + 1}`,
      summaryText: "No data found for this section.",
      keyFindings: [],
      disclaimers: [],
      ratings: [],
      timelineItems: [],
      sourceRefs: []
    })),
    sources: {}
  };
  const tempDir = await mkdtemp(path.join(tmpdir(), "bg-check-render-"));
  const jsonPath = path.join(tempDir, "Acme_Labs_KnowYourCompany_2026-04-17.report.json");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const first = await renderFromJson(jsonPath);
  const second = await renderFromJson(jsonPath);
  const persisted = await readFile(first.outputPath, "utf8");

  assert.equal(first.outputPath, path.join(tempDir, "Acme_Labs_KnowYourCompany_2026-04-17.html"));
  assert.equal(first.html, second.html);
  assert.equal(first.html, persisted);
  assert.equal(/\{\{[^}]+\}\}/.test(first.html), false);
});
