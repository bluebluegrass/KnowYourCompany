export const CACHE_VERSIONS = {
  fetch: "v1",
  clean: "v1",
  packet: "v1",
  sectionAnalysis: "v1",
  summary: "v1",
  localization: "v1"
} as const;

export const PROMPT_VERSIONS = {
  section: "v1",
  summary: "v1",
  translation: "v1"
} as const;

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
export const DEFAULT_CANONICAL_LANGUAGE = "English";
export const DEFAULT_OUTPUT_LANGUAGE = "English";
