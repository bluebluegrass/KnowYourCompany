import assert from "node:assert/strict";
import test from "node:test";
import { validateSectionAnalysis } from "../src/model/schema.js";
import { createReportV2 } from "../src/report/v2-report.js";
import { buildQueryPlan } from "../src/retrieval/query-planner.js";
import { renderReportV2 } from "../src/render/v2-renderer.js";
import type { SectionAnalysis, SourceDocument } from "../src/types/index.js";

const source: SourceDocument = {
  url: "https://investors.example.com/results",
  normalizedUrl: "https://investors.example.com/results",
  title: "Example Q2 results",
  fetchedAt: "2026-09-08T00:00:00.000Z",
  language: "en",
  html: "",
  text: "",
  sourceType: "official",
  sourceTier: "primary",
  publishedAt: "2026-08-08T00:00:00.000Z",
  trustScore: 0.95
};

test("financial query plan covers public results, startup funding, IPO, and ownership signals", () => {
  const queries = buildQueryPlan({ company: "Example", localLanguage: "en", outputDir: ".", now: "2026-09-08T00:00:00.000Z" })
    .filter((item) => item.sectionId === "financial_health")
    .map((item) => item.query);
  assert.equal(queries.length, 6);
  assert.ok(queries.some((query) => /earnings.*revenue.*net income/i.test(query)));
  assert.ok(queries.some((query) => /investor relations.*annual report/i.test(query)));
  assert.ok(queries.some((query) => /funding round.*valuation.*investors/i.test(query)));
  assert.ok(queries.some((query) => /IPO.*going public/i.test(query)));
  assert.ok(queries.some((query) => /private equity.*parent company/i.test(query)));
});

test("financial analysis requires source-backed metrics and events", () => {
  const base = financialSection();
  assert.doesNotThrow(() => validateSectionAnalysis(base));
  assert.throws(() => validateSectionAnalysis({
    ...base,
    financeProfile: { ...base.financeProfile, metrics: [{ label: "Revenue", value: "$10m", sourceRefs: "not-an-array" }] }
  }));
});

test("v2 financial section preserves a plain-language explanation and decision signals", () => {
  const analysis = {
    company: "Example",
    sources: { official: source },
    sections: [financialSection()]
  };
  const report = createReportV2(analysis, { company: "Example", localLanguage: "en", outputDir: ".", now: "2026-09-08T00:00:00.000Z" });
  const finance = report.sections[0]!;
  assert.equal(finance.financePlainLanguage, "Sales grew, but the company is still losing money. That can mean room to invest, but ask how long the current budget is expected to last.");
  assert.equal(finance.financeProfile?.metrics[0]?.value, "$10m");
  const html = renderReportV2(report);
  assert.match(html, /Finance, in plain language/);
  assert.match(html, /What this could mean for you/);
  assert.match(html, /Still unknown/);
});

function financialSection(): SectionAnalysis {
  return {
    sectionId: "financial_health",
    title: "Financial Health",
    summaryText: "The latest reported sales grew, but the company remained loss-making and its next funding needs are unclear.",
    claims: [{ text: "Revenue reached $10m in Q2, while the company reported a net loss.", sourceRefs: ["official"], impact: "watch", evidenceState: "verified" }],
    plainEnglishFinanceText: "Sales grew, but the company is still losing money. That can mean room to invest, but ask how long the current budget is expected to last.",
    financeProfile: {
      companyType: "public",
      confidence: "high",
      trend: "mixed",
      sourceRefs: ["official"],
      metrics: [{ label: "Revenue", value: "$10m", period: "Q2 2026", trend: "improving", sourceRefs: ["official"] }],
      events: [{ kind: "earnings", title: "Q2 results", detail: "Revenue grew while the company remained loss-making.", date: "2026-08-08", sourceRefs: ["official"] }],
      jobSeekerImplications: ["Ask whether this team has approved hiring budget for the next 12 months."],
      unknowns: ["The public results do not explain when the company expects to become profitable."]
    },
    sourceRefs: ["official"]
  };
}
