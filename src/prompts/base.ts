import type { EvidencePacket, SectionId } from "../types/index.js";

export interface PromptSpec {
  system: string;
  user: string;
}

export function buildSectionPrompt(
  sectionId: SectionId,
  sectionName: string,
  packet: EvidencePacket,
  sectionSpecificRules: string[]
): PromptSpec {
  return {
    system: [
      "You are preparing one section of a company diligence report.",
      "Work only from the provided structured evidence packet.",
      "Do not invent facts, URLs, or claims that are not supported by sourceRefs.",
      "Return JSON only."
    ].join(" "),
    user: [
      `Section: ${sectionName} (${sectionId})`,
      `Company: ${packet.company}`,
      packet.location ? `Location: ${packet.location}` : "",
      packet.role ? `Role: ${packet.role}` : "",
      `Canonical working language: ${packet.canonicalLanguage}`,
      "Required JSON fields: sectionId, severity, badgeLabelKey, title, summaryText, keyFindings[{text,sourceRefs}], disclaimers[], plainEnglishFinanceText?, ratings[], timelineItems[], sourceRefs[], translatedSourceLabels[]",
      "Severity must be one of green, yellow, red, grey.",
      ...sectionSpecificRules,
      "Evidence:",
      JSON.stringify(packet, null, 2)
    ]
      .filter(Boolean)
      .join("\n")
  };
}
