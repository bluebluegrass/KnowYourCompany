import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvidenceToCanonicalLanguage } from "../src/localization/canonicalizer.js";
import { PassthroughTranslator } from "../src/localization/translator.js";

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
