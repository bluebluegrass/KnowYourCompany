import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { validateReportV2 } from "../model/schema.js";
import { buildHtmlPath } from "../report/artifact-paths.js";
import type { ReportV2 } from "../types/index.js";
import { renderReportV2 } from "./v2-renderer.js";

export async function renderFromJson(jsonPath: string, outputDir?: string): Promise<{ report: ReportV2; html: string; outputPath: string }> {
  const report = parseReport(await readFile(jsonPath, "utf8"), jsonPath);
  const html = renderReportV2(report);
  const outputPath = buildHtmlPath(outputDir || path.dirname(jsonPath), report.target.company, report.generatedAt.slice(0, 10));
  await writeFile(outputPath, html, "utf8");
  return { report, html, outputPath };
}

function parseReport(raw: string, jsonPath: string): ReportV2 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse report JSON at ${jsonPath}: ${(error as Error).message}`);
  }
  try {
    validateReportV2(value);
  } catch (error) {
    throw new Error(`Report JSON at ${jsonPath} is not a current report: ${(error as Error).message}`);
  }
  return value;
}
