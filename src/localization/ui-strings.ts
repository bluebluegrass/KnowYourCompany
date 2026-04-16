import { FIXED_LABELS, languageToHtmlLang } from "../config/localization.js";

export interface UiStrings {
  badgeLabel: (key: "no_concerns" | "mixed_signals" | "concern_found" | "no_data") => string;
  label: (key: keyof typeof FIXED_LABELS.en) => string;
  htmlLang: string;
}

export function createUiStrings(outputLanguage: string): UiStrings {
  const lang = languageToHtmlLang(outputLanguage);
  const dictionary = FIXED_LABELS.en;
  return {
    badgeLabel(key) {
      return dictionary[key];
    },
    label(key) {
      return dictionary[key];
    },
    htmlLang: lang
  };
}
