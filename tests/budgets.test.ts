import test from "node:test";
import assert from "node:assert/strict";
import { SECTION_DEFINITIONS } from "../src/config/sections.js";
import { buildEvidencePacket, dedupeEvidence } from "../src/evidence/evidence-pipeline.js";

test("section definitions include explicit per-section budgets", () => {
  for (const section of SECTION_DEFINITIONS) {
    assert.equal(typeof section.maxQueries, "number");
    assert.equal(typeof section.maxFetchedPages, "number");
    assert.equal(typeof section.maxEvidenceItems, "number");
    assert.equal(typeof section.maxCommunityItems, "number");
    assert.equal(section.maxQueries > 0, true);
    assert.equal(section.maxFetchedPages > 0, true);
    assert.equal(section.maxEvidenceItems > 0, true);
    assert.equal(section.maxCommunityItems > 0, true);
  }
});

test("dedupeEvidence enforces maxCommunityItems budget", () => {
  const snippets = Array.from({ length: 5 }, (_, index) => ({
    snippetId: `id-${index}`,
    sourceId: `src-${index}`,
    sectionId: "company_culture" as const,
    title: `Title ${index}`,
    url: `https://example.com/${index}`,
    sourceType: "community" as const,
    sourceLanguage: "en",
    translated: false,
    fetchedAt: "2026-04-16T00:00:00.000Z",
    excerptOriginal: `Management complaint ${index}`,
    excerptCanonical: `Management complaint ${index}`,
    trustScore: 0.4,
    relevanceScore: 0.5,
    includedViaException: false,
    inclusionReason: "within-24-months"
  }));

  const deduped = dedupeEvidence(snippets, 2);
  assert.equal(deduped.length, 2);
});

test("buildEvidencePacket enforces maxEvidenceItems budget", () => {
  const input = {
    company: "Acme",
    localLanguage: "en",
    outputDir: ".",
    now: "2026-04-16T00:00:00.000Z"
  };

  const documents = Array.from({ length: 20 }, (_, index) => ({
    url: `https://example.com/${index}`,
    normalizedUrl: `https://example.com/${index}`,
    title: `Title ${index}`,
    fetchedAt: "2026-04-16T00:00:00.000Z",
    language: "en",
    html: "<html></html>",
    text: `Acme funding revenue profitability runway report ${index}`,
    sourceType: "news" as const,
    publishedAt: "2026-01-01T00:00:00.000Z",
    trustScore: 0.8
  }));

  const packet = buildEvidencePacket("financial_health", input, documents, 5);
  const section = SECTION_DEFINITIONS.find((item) => item.id === "financial_health");
  assert.ok(section);
  assert.equal(packet.evidence.length <= section.maxEvidenceItems, true);
});
