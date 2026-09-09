import { CACHE_VERSIONS } from "../config/constants.js";
import { FileCache } from "../cache/file-cache.js";
import { validateSectionAnalysis } from "./schema.js";
import type { EvidencePacket, SectionAnalysis, SectionId } from "../types/index.js";
import type { ModelClient } from "./anthropic-client.js";
import { buildSectionPrompt } from "../prompts/sections.js";

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
    const section = await this.model.completeJson<SectionAnalysis>(prompt, packet.sectionId);
    validateSectionAnalysis(section);
    await this.cache.set("section-analysis", cacheKey, CACHE_VERSIONS.sectionAnalysis, section);
    return section;
  }
}

function promptForSection(sectionId: SectionId, packet: EvidencePacket) {
  return buildSectionPrompt(sectionId, packet);
}
