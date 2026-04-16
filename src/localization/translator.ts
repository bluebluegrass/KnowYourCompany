import { CACHE_VERSIONS } from "../config/constants.js";
import { FileCache } from "../cache/file-cache.js";
import type { ModelClient } from "../model/anthropic-client.js";
import { validateFinalSummary, validateSectionAnalysis } from "../model/schema.js";
import type { FinalSummary, SectionAnalysis } from "../types/index.js";

export interface Translator {
  translateTextBundle(bundle: TranslationBundle, options: TranslationOptions): Promise<TranslationBundle>;
}

export interface TranslationBundle {
  summary: FinalSummary;
  sections: SectionAnalysis[];
}

export interface TranslationOptions {
  canonicalLanguage: string;
  outputLanguage: string;
}

export class PassthroughTranslator implements Translator {
  async translateTextBundle(bundle: TranslationBundle, _options: TranslationOptions): Promise<TranslationBundle> {
    return bundle;
  }
}

export class ModelTranslator implements Translator {
  constructor(
    private readonly model: ModelClient,
    private readonly cache: FileCache
  ) {}

  async translateTextBundle(bundle: TranslationBundle, options: TranslationOptions): Promise<TranslationBundle> {
    if (options.outputLanguage.trim().toLowerCase() === options.canonicalLanguage.trim().toLowerCase()) {
      return bundle;
    }

    const cacheKey = this.cache.createKey([
      options.canonicalLanguage,
      options.outputLanguage,
      JSON.stringify(bundle)
    ]);
    const cached = await this.cache.get<TranslationBundle>("localization", cacheKey, CACHE_VERSIONS.localization);
    if (cached) {
      return cached;
    }

    const translated = await this.model.completeJson<TranslationBundle>({
      system: [
        "You translate finalized report prose fields into the requested output language.",
        "Return JSON only.",
        "Preserve object structure exactly.",
        "Translate only user-facing plain text fields.",
        "Do not introduce HTML.",
        "Do not change severity, sourceRefs, or structural arrays except for translating their text values.",
        "Keep translatedSourceLabels transparent and concise."
      ].join(" "),
      user: [
        `Canonical language: ${options.canonicalLanguage}`,
        `Output language: ${options.outputLanguage}`,
        "Translate summary.verdictText, summary.verdictFlags[].text, sections[].title, sections[].summaryText, sections[].keyFindings[].text, sections[].disclaimers[], sections[].plainEnglishFinanceText, sections[].ratings[].label/value, sections[].timelineItems[].title/meta, sections[].translatedSourceLabels[].",
        "Do not change sourceRefs or severity.",
        JSON.stringify(bundle, null, 2)
      ].join("\n")
    });

    validateFinalSummary(translated.summary);
    translated.sections.forEach((section) => validateSectionAnalysis(section));
    await this.cache.set("localization", cacheKey, CACHE_VERSIONS.localization, translated);
    return translated;
  }
}
