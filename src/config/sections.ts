import type { SectionId } from "../types/index.js";

export interface SectionDefinition {
  id: SectionId;
  order: number;
  title: string;
  shortLabel: string;
  recencyMonths?: number;
  allowDurableSources: boolean;
  highValueLocalLanguage: boolean;
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: "layoffs", order: 1, title: "Recent Layoffs", shortLabel: "Layoffs", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "financial_health", order: 2, title: "Financial Health", shortLabel: "Financial", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "leadership_stability", order: 3, title: "Leadership Stability", shortLabel: "Leadership", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "legal_regulatory", order: 4, title: "Legal & Regulatory", shortLabel: "Legal", recencyMonths: 24, allowDurableSources: true, highValueLocalLanguage: true },
  { id: "company_culture", order: 5, title: "Company Culture", shortLabel: "Culture", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "work_policy", order: 6, title: "Remote / Hybrid / RTO Policy", shortLabel: "RTO Policy", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "compensation_benefits", order: 7, title: "Compensation & Benefits", shortLabel: "Compensation", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "interview_experience", order: 8, title: "Interview Experience", shortLabel: "Interview", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "visa_sponsorship", order: 9, title: "Visa & Immigration Sponsorship", shortLabel: "Visa", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "product_market_health", order: 10, title: "Product & Market Health", shortLabel: "Product", recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "company_profile_history", order: 11, title: "Company Profile & History", shortLabel: "Profile", allowDurableSources: true, highValueLocalLanguage: false },
  { id: "founder_background", order: 12, title: "Founder Background", shortLabel: "Founder", recencyMonths: 24, allowDurableSources: true, highValueLocalLanguage: false }
];

export const SECTION_BY_ID = new Map(SECTION_DEFINITIONS.map((section) => [section.id, section]));

export function getSectionDefinition(sectionId: SectionId): SectionDefinition {
  const definition = SECTION_BY_ID.get(sectionId);
  if (!definition) {
    throw new Error(`Unknown section: ${sectionId}`);
  }
  return definition;
}
