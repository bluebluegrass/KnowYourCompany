import { getSectionDefinition } from "../config/sections.js";
import type { EvidencePacket, SectionId } from "../types/index.js";

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
    "Always provide financeProfile with companyType, confidence, trend, sourceRefs, metrics, events, jobSeekerImplications, and unknowns.",
    "Classify the company from evidence only: public, startup, private, subsidiary, or unknown. Do not infer that a company is public or venture-backed from its size, brand, or job listings.",
    "For a public company, find the most recent quarterly or annual results available. In financeProfile.metrics, capture only directly supported headline metrics such as revenue, year-over-year change, profit or loss, cash, debt, or free cash flow. State the reporting period and trend where the evidence supports a comparison. Prefer company investor-relations pages, annual/quarterly filings, and regulators over news coverage.",
    "For a startup, identify the latest confirmed funding round, date, amount, lead investors, and valuation only when each is explicitly reported. Add IPO or going-public signals only when they are confirmed by the company or clearly reported by a reputable source; label a rumor as a rumor. Do not claim that no IPO plan exists just because you did not find one.",
    "For a private, subsidiary, or other company, report every decision-useful public financial signal you can verify: parent-company ownership, acquisition or private-equity ownership, reported revenue or profitability, debt, transaction value, credit events, or funding. If filings are unavailable, say so clearly instead of estimating financial health.",
    "Every financeProfile metric and event must have at least one sourceRef from the supplied evidence. Keep sourceRefs at the profile level for the classification itself. Use an empty metrics or events array when no reliable public financial data is available.",
    "Write plainEnglishFinanceText in everyday language, no more than 110 words. Explain what the evidence may mean for job stability, ability to invest in growth, and compensation or equity risk. Avoid finance jargon; when a finance term is unavoidable, define it in the same sentence.",
    "Write two or three concise, plain-language jobSeekerImplications. Put material gaps, stale data, and unverified reports in unknowns."
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
    "When community rating metrics are available, describe each one as a separately sourced claim."
  ],
  work_policy: [
    "Separate official policy from employee sentiment into distinct claims."
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
    "When review platform metrics are available, describe each one as a separately sourced claim."
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
      "Required JSON fields: sectionId, title, summaryText, claims[{text,sourceRefs,scope?,impact?,evidenceState?}], plainEnglishFinanceText?, financeProfile?, sourceRefs[]",
      "summaryText must be a complete, decision-useful summary of no more than 45 words. Lead with the decisive signal; for red or yellow sections, never lead with a positive detail when a material concern or uncertainty is present.",
      "Each claim must express exactly one fact or clearly labeled community theme, and sourceRefs must only use source IDs supplied in Evidence.",
      ...SECTION_PROMPT_RULES[sectionId],
      "Evidence:",
      JSON.stringify(packet, null, 2)
    ]
      .filter(Boolean)
      .join("\n")
  };
}
