export const CACHE_VERSIONS = {
  fetch: "v1",
  clean: "v1",
  packet: "v1",
  sectionAnalysis: "v1",
  summary: "v1"
} as const;

export const PROMPT_VERSIONS = {
  section: "v1",
  summary: "v1"
} as const;

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
