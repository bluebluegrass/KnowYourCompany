import type { FinalSummary, SectionAnalysis } from "../types/index.js";

export interface Translator {
  translateTextBundle(bundle: TranslationBundle): Promise<TranslationBundle>;
}

export interface TranslationBundle {
  summary: FinalSummary;
  sections: SectionAnalysis[];
}

export class PassthroughTranslator implements Translator {
  async translateTextBundle(bundle: TranslationBundle): Promise<TranslationBundle> {
    return bundle;
  }
}
