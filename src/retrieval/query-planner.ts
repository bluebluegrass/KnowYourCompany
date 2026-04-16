import { getSectionDefinition, SECTION_DEFINITIONS } from "../config/sections.js";
import type { InputContext, QueryPlan, SectionId } from "../types/index.js";

const SECTION_QUERIES: Record<SectionId, (input: InputContext) => string[]> = {
  layoffs: ({ company }) => [`"${company}" layoffs`, `"${company}" reorganization`, `site:layoffs.fyi "${company}"`],
  financial_health: ({ company }) => [`"${company}" funding`, `"${company}" valuation`, `"${company}" revenue OR profitability OR runway`],
  leadership_stability: ({ company }) => [`"${company}" CEO OR CTO resigned`, `"${company}" leadership team`],
  legal_regulatory: ({ company }) => [`"${company}" lawsuit OR settlement`, `"${company}" regulatory action OR investigation`],
  company_culture: ({ company, role }) => [`"${company}" Glassdoor reviews`, `"${company}" Teamblind`, role ? `"${company}" "${role}" site:reddit.com` : `"${company}" site:reddit.com culture`],
  work_policy: ({ company }) => [`"${company}" return to office`, `"${company}" remote work policy`, `"${company}" site:reddit.com hybrid`],
  compensation_benefits: ({ company, role }) => [`"${company}" salary range`, role ? `"${company}" "${role}" compensation` : `"${company}" compensation`, `site:levels.fyi "${company}"`],
  interview_experience: ({ company, role }) => [`"${company}" interview process`, role ? `"${company}" "${role}" interview` : `"${company}" Glassdoor interview"`],
  visa_sponsorship: ({ company, location }) => [`"${company}" visa sponsorship ${location || ""}`.trim(), `"${company}" immigration sponsorship jobs`],
  product_market_health: ({ company }) => [`"${company}" G2 OR Capterra OR app reviews`, `"${company}" outage OR controversy OR growth`],
  company_profile_history: ({ company }) => [`"${company}" about`, `"${company}" founded history milestones`, `"${company}" Wikipedia`],
  founder_background: ({ company }) => [`"${company}" founder`, `"${company}" founder background OR controversy`]
};

export function buildQueryPlan(input: InputContext): QueryPlan[] {
  const queries: QueryPlan[] = [];
  for (const section of SECTION_DEFINITIONS) {
    const sectionQueries = SECTION_QUERIES[section.id](input);
    const localEligible = input.localLanguage !== "en" && getSectionDefinition(section.id).highValueLocalLanguage;
    sectionQueries.forEach((query, index) => {
      queries.push({
        sectionId: section.id,
        query,
        language: "en",
        priority: index,
        ...(section.recencyMonths ? { recencyMonths: section.recencyMonths } : {}),
        reason: "default-search"
      });
      if (localEligible) {
        queries.push({
          sectionId: section.id,
          query: `${query} ${input.localLanguage}`,
          language: input.localLanguage,
          priority: index + 10,
          ...(section.recencyMonths ? { recencyMonths: section.recencyMonths } : {}),
          reason: "high-value-local-language"
        });
      }
    });
  }
  return queries;
}
