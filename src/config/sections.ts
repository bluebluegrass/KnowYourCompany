import type { SectionId } from "../types/index.js";

export interface SectionDefinition {
  id: SectionId;
  order: number;
  title: string;
  shortLabel: string;
  maxQueries: number;
  maxFetchedPages: number;
  maxEvidenceItems: number;
  maxCommunityItems: number;
  recencyMonths?: number;
  allowDurableSources: boolean;
  highValueLocalLanguage: boolean;
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: "layoffs", order: 1, title: "Recent Layoffs", shortLabel: "Layoffs", maxQueries: 4, maxFetchedPages: 6, maxEvidenceItems: 8, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "financial_health", order: 2, title: "Financial Health", shortLabel: "Financial", maxQueries: 5, maxFetchedPages: 7, maxEvidenceItems: 10, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "leadership_stability", order: 3, title: "Leadership Stability", shortLabel: "Leadership", maxQueries: 3, maxFetchedPages: 5, maxEvidenceItems: 6, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "legal_regulatory", order: 4, title: "Legal & Regulatory", shortLabel: "Legal", maxQueries: 5, maxFetchedPages: 7, maxEvidenceItems: 9, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: true, highValueLocalLanguage: true },
  { id: "company_culture", order: 5, title: "Company Culture", shortLabel: "Culture", maxQueries: 5, maxFetchedPages: 7, maxEvidenceItems: 8, maxCommunityItems: 3, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "work_policy", order: 6, title: "Remote / Hybrid / RTO Policy", shortLabel: "RTO Policy", maxQueries: 4, maxFetchedPages: 6, maxEvidenceItems: 7, maxCommunityItems: 2, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "compensation_benefits", order: 7, title: "Compensation & Benefits", shortLabel: "Compensation", maxQueries: 4, maxFetchedPages: 6, maxEvidenceItems: 7, maxCommunityItems: 2, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "interview_experience", order: 8, title: "Interview Experience", shortLabel: "Interview", maxQueries: 3, maxFetchedPages: 5, maxEvidenceItems: 6, maxCommunityItems: 3, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "visa_sponsorship", order: 9, title: "Visa & Immigration Sponsorship", shortLabel: "Visa", maxQueries: 4, maxFetchedPages: 6, maxEvidenceItems: 7, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: true },
  { id: "product_market_health", order: 10, title: "Product & Market Health", shortLabel: "Product", maxQueries: 4, maxFetchedPages: 6, maxEvidenceItems: 8, maxCommunityItems: 2, recencyMonths: 24, allowDurableSources: false, highValueLocalLanguage: false },
  { id: "company_profile_history", order: 11, title: "Company Profile & History", shortLabel: "Profile", maxQueries: 3, maxFetchedPages: 5, maxEvidenceItems: 6, maxCommunityItems: 1, allowDurableSources: true, highValueLocalLanguage: false },
  { id: "founder_background", order: 12, title: "Founder Background", shortLabel: "Founder", maxQueries: 3, maxFetchedPages: 5, maxEvidenceItems: 6, maxCommunityItems: 1, recencyMonths: 24, allowDurableSources: true, highValueLocalLanguage: false }
];

export const SECTION_BY_ID = new Map(SECTION_DEFINITIONS.map((section) => [section.id, section]));

export function getSectionDefinition(sectionId: SectionId): SectionDefinition {
  const definition = SECTION_BY_ID.get(sectionId);
  if (!definition) {
    throw new Error(`Unknown section: ${sectionId}`);
  }
  return definition;
}
