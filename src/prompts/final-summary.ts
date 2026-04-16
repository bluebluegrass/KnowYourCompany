import type { SectionAnalysis } from "../types/index.js";

export function buildFinalSummaryPrompt(company: string, sections: SectionAnalysis[]): { system: string; user: string } {
  return {
    system: [
      "You are writing the top summary for a company diligence report.",
      "You receive fully analyzed section JSON only.",
      "Return JSON with verdictText and verdictFlags[{tone,text}] only.",
      "Do not invent evidence beyond the provided sections."
    ].join(" "),
    user: [
      `Company: ${company}`,
      "Write a concise but decision-useful top-line verdict.",
      JSON.stringify(sections, null, 2)
    ].join("\n")
  };
}
