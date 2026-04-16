import { CACHE_VERSIONS } from "../config/constants.js";
import { FileCache } from "../cache/file-cache.js";
import { validateFinalSummary, validateSectionAnalysis } from "./schema.js";
import type { EvidencePacket, FinalSummary, SectionAnalysis, SectionId } from "../types/index.js";
import type { ModelClient } from "./anthropic-client.js";
import { buildLayoffsPrompt } from "../prompts/layoffs.js";
import { buildFinancePrompt } from "../prompts/finance.js";
import { buildLeadershipPrompt } from "../prompts/leadership.js";
import { buildLegalPrompt } from "../prompts/legal.js";
import { buildCulturePrompt } from "../prompts/culture.js";
import { buildWorkPolicyPrompt } from "../prompts/work-policy.js";
import { buildCompensationPrompt } from "../prompts/compensation.js";
import { buildInterviewPrompt } from "../prompts/interview.js";
import { buildVisaPrompt } from "../prompts/visa.js";
import { buildProductHealthPrompt } from "../prompts/product-health.js";
import { buildCompanyProfilePrompt } from "../prompts/company-profile.js";
import { buildFounderBackgroundPrompt } from "../prompts/founder-background.js";
import { buildFinalSummaryPrompt } from "../prompts/final-summary.js";

export class SectionAnalyzer {
  constructor(
    private readonly model: ModelClient,
    private readonly cache: FileCache
  ) {}

  async analyze(packet: EvidencePacket): Promise<SectionAnalysis> {
    const cacheKey = this.cache.createKey([packet.company, packet.sectionId, packet.evidenceHash]);
    const cached = await this.cache.get<SectionAnalysis>("section-analysis", cacheKey, CACHE_VERSIONS.sectionAnalysis);
    if (cached) {
      return cached;
    }
    const prompt = promptForSection(packet.sectionId, packet);
    const section = await this.model.completeJson<SectionAnalysis>(prompt);
    validateSectionAnalysis(section);
    await this.cache.set("section-analysis", cacheKey, CACHE_VERSIONS.sectionAnalysis, section);
    return section;
  }

  async summarize(company: string, sections: SectionAnalysis[]): Promise<FinalSummary> {
    const cacheKey = this.cache.createKey([company, JSON.stringify(sections)]);
    const cached = await this.cache.get<FinalSummary>("summary", cacheKey, CACHE_VERSIONS.summary);
    if (cached) {
      return cached;
    }
    const prompt = buildFinalSummaryPrompt(company, sections);
    const summary = await this.model.completeJson<FinalSummary>(prompt);
    validateFinalSummary(summary);
    await this.cache.set("summary", cacheKey, CACHE_VERSIONS.summary, summary);
    return summary;
  }
}

function promptForSection(sectionId: SectionId, packet: EvidencePacket) {
  switch (sectionId) {
    case "layoffs":
      return buildLayoffsPrompt(packet);
    case "financial_health":
      return buildFinancePrompt(packet);
    case "leadership_stability":
      return buildLeadershipPrompt(packet);
    case "legal_regulatory":
      return buildLegalPrompt(packet);
    case "company_culture":
      return buildCulturePrompt(packet);
    case "work_policy":
      return buildWorkPolicyPrompt(packet);
    case "compensation_benefits":
      return buildCompensationPrompt(packet);
    case "interview_experience":
      return buildInterviewPrompt(packet);
    case "visa_sponsorship":
      return buildVisaPrompt(packet);
    case "product_market_health":
      return buildProductHealthPrompt(packet);
    case "company_profile_history":
      return buildCompanyProfilePrompt(packet);
    case "founder_background":
      return buildFounderBackgroundPrompt(packet);
  }
}
