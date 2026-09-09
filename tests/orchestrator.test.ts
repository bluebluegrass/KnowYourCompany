import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SECTION_DEFINITIONS } from "../src/config/sections.js";
import { RunLogger } from "../src/logging/run-logger.js";
import { runReport } from "../src/report/orchestrator.js";
import type { QueryPlan, SearchResult, SectionAnalysis, SourceDocument } from "../src/types/index.js";

test("runReport writes report json and does not write html in research-only mode", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "bg-check-orchestrator-"));
  const previousCwd = process.cwd();
  const logger = new RunLogger();

  let searchCalls = 0;
  const searchClient = {
    async search(query: QueryPlan): Promise<SearchResult[]> {
      const url = new URL("https://example.com/search");
      url.searchParams.set("q", query.query);
      searchCalls += 1;
      assert.equal(url.toString().startsWith("https://example.com/search?q="), true);
      return [];
    }
  };

  const fetcher = {
    async fetch(_result: SearchResult): Promise<SourceDocument> {
      throw new Error("fetch should not be called when search returns no results");
    }
  };

  const model = {
    async completeJson<T>(_prompt: { system: string; user: string }, label?: string): Promise<T> {
      const sectionDef = SECTION_DEFINITIONS.find((section) => section.id === label);
      assert.ok(sectionDef, `Unexpected label: ${String(label)}`);
      const section: SectionAnalysis = {
        sectionId: sectionDef.id,
        title: sectionDef.title,
        summaryText: "No data found for this section.",
        claims: [],
        sourceRefs: []
      };
      return section as T;
    }
  };

  try {
    process.chdir(tempDir);
    const result = await runReport(
      {
        company: "Acme Research",
        location: "Amsterdam",
        role: "Engineer",
        localLanguage: "nl",
        outputDir: tempDir,
        now: "2026-04-17T12:00:00.000Z"
      },
      { fetcher, logger, model, searchClient }
    );

    const htmlPath = path.join(tempDir, "Acme_Research_KnowYourCompany_2026-04-17.html");
    const jsonRaw = await readFile(result.jsonPath, "utf8");
    const report = JSON.parse(jsonRaw) as { reportVersion: number; target: { company: string }; generatedAt: string; sections: unknown[] };

    assert.equal(result.jsonPath, path.join(tempDir, "Acme_Research_KnowYourCompany_2026-04-17.report.json"));
    assert.equal(report.reportVersion, 2);
    assert.equal(report.target.company, "Acme Research");
    assert.equal(report.generatedAt, "2026-04-17T12:00:00.000Z");
    assert.equal(report.sections.length, SECTION_DEFINITIONS.length);
    await assert.rejects(access(htmlPath, fsConstants.F_OK));
    assert.equal(searchCalls > 0, true);
    assert.equal(Object.keys(result.logger.metrics.searchCount).length > 0, true);
  } finally {
    process.chdir(previousCwd);
  }
});
