import { getSectionDefinition } from "../config/sections.js";
import type { EvidencePacket, SectionAnalysis, SectionId } from "../types/index.js";

interface PromptSpec {
  system: string;
  user: string;
}

const SECTION_PROMPT_RULES: Record<SectionId, string[]> = {
  layoffs: [
    "Flag red when layoffs above 10% in the past 6 months or repeated reductions signal instability."
  ],
  financial_health: [
    "Always provide plainEnglishFinanceText.",
    "Use timelineItems for funding rounds if present."
  ],
  leadership_stability: [
    "Flag red for abrupt CEO/CTO removal or multiple key exits in a short period."
  ],
  legal_regulatory: [
    "Include an informational legal disclaimer even when evidence is sparse.",
    "Treat ongoing, unresolved, or active matters as materially relevant even if older than 24 months."
  ],
  company_culture: [
    "Include a disclaimer that community-sourced culture data is self-reported and unverified.",
    "Use ratings[] when community rating metrics are available."
  ],
  work_policy: [
    "Separate official policy from employee sentiment in keyFindings."
  ],
  compensation_benefits: [
    "Include a disclaimer that salary and equity data from community sources is self-reported and unverified."
  ],
  interview_experience: [
    "Include a disclaimer that interview reports are self-reported and unverified."
  ],
  visa_sponsorship: [
    "Use country-specific language when location evidence supports it rather than generic visa wording."
  ],
  product_market_health: [
    "Use ratings[] when review platform metrics are available."
  ],
  company_profile_history: [
    "Prefer durable official and background sources; no strict 24 month cap applies."
  ],
  founder_background: [
    "Older sources may be used for durable biography facts, but recent developments should dominate current-risk analysis."
  ]
};

export function buildSectionPrompt(sectionId: SectionId, packet: EvidencePacket): PromptSpec {
  const section = getSectionDefinition(sectionId);
  return {
    system: [
      "You are preparing one section of a company diligence report.",
      "Work only from the provided structured evidence packet.",
      "Do not invent facts, URLs, or claims that are not supported by sourceRefs.",
      "Return JSON only."
    ].join(" "),
    user: [
      `Section: ${section.title} (${sectionId})`,
      `Company: ${packet.company}`,
      packet.location ? `Location: ${packet.location}` : "",
      packet.role ? `Role: ${packet.role}` : "",
      "Required JSON fields: sectionId, severity, badgeLabelKey, title, summaryText, keyFindings[{text,sourceRefs}], disclaimers[], plainEnglishFinanceText?, ratings[], timelineItems[], sourceRefs[]",
      "Severity must be one of green, yellow, red, grey.",
      ...SECTION_PROMPT_RULES[sectionId],
      "Evidence:",
      JSON.stringify(packet, null, 2)
    ]
      .filter(Boolean)
      .join("\n")
  };
}

export function buildFinalSummaryPrompt(company: string, sections: SectionAnalysis[]): PromptSpec {
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
