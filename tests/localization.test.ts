import test from "node:test";
import assert from "node:assert/strict";
import { FileCache } from "../src/cache/file-cache.js";
import { RunLogger } from "../src/logging/run-logger.js";
import { StubModelClient } from "../src/model/anthropic-client.js";
import { normalizeEvidenceToCanonicalLanguage } from "../src/localization/canonicalizer.js";
import { ModelTranslator, PassthroughTranslator } from "../src/localization/translator.js";
import { createUiStrings } from "../src/localization/ui-strings.js";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("late translation path preserves structured packet shape", async () => {
  const packet = {
    sectionId: "layoffs" as const,
    company: "Acme",
    canonicalLanguage: "English",
    evidenceHash: "hash",
    evidence: [],
    stats: { queryCount: 1, retrievedCount: 1, recencyFilteredCount: 1, sentToModelCount: 0 }
  };
  const normalized = await normalizeEvidenceToCanonicalLanguage(packet, "English", new PassthroughTranslator());
  assert.deepEqual(normalized, packet);
});

test("translator translates final summary and section text fields late", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kyc-localization-"));
  const cache = new FileCache(dir, new RunLogger());
  const translator = new ModelTranslator(
    new StubModelClient(() => ({
      summary: {
        verdictText: "Resumen final",
        verdictFlags: [{ tone: "yellow", text: "Señales limitadas" }]
      },
      sections: [
        {
          sectionId: "layoffs",
          severity: "grey",
          badgeLabelKey: "no_data",
          title: "Despidos recientes",
          summaryText: "No se encontraron datos para esta sección.",
          keyFindings: [],
          disclaimers: [],
          ratings: [],
          timelineItems: [],
          sourceRefs: [],
          translatedSourceLabels: []
        }
      ]
    })),
    cache
  );

  const translated = await translator.translateTextBundle(
    {
      summary: {
        verdictText: "Final summary",
        verdictFlags: [{ tone: "yellow", text: "Limited signal" }]
      },
      sections: [
        {
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
        }
      ]
    },
    {
      canonicalLanguage: "English",
      outputLanguage: "Spanish"
    }
  );

  assert.equal(translated.summary.verdictText, "Resumen final");
  assert.equal(translated.sections[0]?.title, "Despidos recientes");
});

test("fixed UI strings localize supported languages", () => {
  const ui = createUiStrings("Dutch");
  assert.equal(ui.badgeLabel("no_data"), "Geen data");
  assert.equal(ui.label("sources"), "Bronnen");
});
