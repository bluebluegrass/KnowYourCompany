import test from "node:test";
import assert from "node:assert/strict";
import { validateFinalSummary, validateSectionAnalysis } from "../src/model/schema.js";

test("validateSectionAnalysis accepts plain-text structured output only", () => {
  const section = {
    sectionId: "layoffs",
    severity: "grey",
    badgeLabelKey: "no_data",
    title: "Recent Layoffs",
    summaryText: "No data found for this section.",
    keyFindings: [],
    disclaimers: [],
    ratings: [],
    timelineItems: [],
    sourceRefs: [],
    translatedSourceLabels: []
  };
  assert.doesNotThrow(() => validateSectionAnalysis(section));
});

test("validateSectionAnalysis rejects malformed data", () => {
  assert.throws(() => validateSectionAnalysis({ severity: "purple" }));
});

test("validateSectionAnalysis rejects raw HTML in intermediate fields", () => {
  assert.throws(() =>
    validateSectionAnalysis({
      sectionId: "layoffs",
      severity: "grey",
      badgeLabelKey: "no_data",
      title: "Recent Layoffs",
      summaryText: "<p>HTML is not allowed here.</p>",
      keyFindings: [],
      disclaimers: [],
      ratings: [],
      timelineItems: [],
      sourceRefs: [],
      translatedSourceLabels: []
    })
  );
});

test("validateFinalSummary validates verdict shape", () => {
  assert.doesNotThrow(() =>
    validateFinalSummary({
      verdictText: "Mixed picture.",
      verdictFlags: [{ tone: "yellow", text: "Limited interview signal" }]
    })
  );
});
