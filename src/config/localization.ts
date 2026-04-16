export const LANGUAGE_CODES: Record<string, string> = {
  english: "en",
  dutch: "nl",
  german: "de",
  french: "fr",
  japanese: "ja",
  chinese: "zh",
  "chinese simplified": "zh",
  portuguese: "pt",
  spanish: "es"
};

export const FIXED_LABELS = {
  en: {
    no_concerns: "No concerns",
    mixed_signals: "Mixed signals",
    concern_found: "Concern found",
    no_data: "No data",
    generated: "Generated",
    office: "Office",
    role: "Role",
    severity_map: "Severity Map",
    severity_intro: "Each card is clickable. The report automatically reorders itself by severity so the most urgent issues rise to the top.",
    bottom_line: "Bottom Line",
    sources: "Sources",
    disclaimer: "Disclaimer",
    plain_english: "Plain English",
    no_data_section: "No data found for this section.",
    footer:
      "This briefing uses public sources and community-reported signal where noted. Community-sourced content is directional and unverified; legal information is informational only and not legal advice.",
    toggle_dark_mode: "Toggle Dark Mode",
    translated_prefix: "[translated from"
  }
} as const;

export function languageToHtmlLang(language: string): string {
  return LANGUAGE_CODES[language.trim().toLowerCase()] || "en";
}
