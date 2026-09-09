import test from "node:test";
import assert from "node:assert/strict";
import { validateReportV2, validateSectionAnalysis } from "../src/model/schema.js";

test("validateSectionAnalysis accepts plain-text structured output only", () => {
  const section = {
    sectionId: "layoffs",
    title: "Recent Layoffs",
    summaryText: "No data found for this section.",
    claims: [],
    sourceRefs: [],
    translatedSourceLabels: []
  };
  assert.doesNotThrow(() => validateSectionAnalysis(section));
});

test("validateSectionAnalysis rejects malformed data", () => {
  assert.throws(() => validateSectionAnalysis({ sectionId: "layoffs" }));
});

test("validateSectionAnalysis rejects raw HTML in intermediate fields", () => {
  assert.throws(() =>
    validateSectionAnalysis({
      sectionId: "layoffs",
      title: "Recent Layoffs",
      summaryText: "<p>HTML is not allowed here.</p>",
      claims: [],
      sourceRefs: [],
      translatedSourceLabels: []
    })
  );
});

test("validateReportV2 accepts only explicit v2 reports", () => {
  assert.doesNotThrow(() => validateReportV2({
    reportVersion: 2,
    reportId: "test",
    generatedAt: "2026-09-06T00:00:00.000Z",
    target: { company: "Acme" },
    sources: {},
    sections: [],
    decision: { recommendation: "insufficient_evidence", rationale: "No data", blockingClaimIds: [], topActionIds: [] },
    actions: [],
    validationWarnings: []
  }));
  assert.throws(() => validateReportV2({ reportVersion: 1 }));
});
