import { query, type OutputFormat } from "@anthropic-ai/claude-agent-sdk";
import { FileCache } from "../cache/file-cache.js";
import { CACHE_VERSIONS, DEFAULT_MODEL } from "../config/constants.js";
import { extractStructuredJson, runClaudeQuery, type ClaudeQueryFn } from "../model/claude-code-client.js";
import type { QueryPlan, SearchResult, SourceDocument, SourceType } from "../types/index.js";

const SEARCH_OUTPUT_FORMAT: OutputFormat = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["results"],
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "url", "snippet"],
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            snippet: { type: "string" }
          }
        }
      }
    }
  }
};

const FETCH_OUTPUT_FORMAT: OutputFormat = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      title: { type: "string" },
      text: { type: "string" },
      content: { type: "string" },
      publishedAt: { type: "string" }
    }
  }
};

interface SearchPayload {
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface FetchPayload {
  title?: string;
  text: string;
  content?: string;
  publishedAt?: string;
}

export class ClaudeCodeSearchClient {
  constructor(private readonly runQuery: ClaudeQueryFn = query) {}

  async search(queryPlan: QueryPlan): Promise<SearchResult[]> {
    const result = await runClaudeQuery(this.runQuery, {
      prompt: buildSearchPrompt(queryPlan),
      options: {
        cwd: process.cwd(),
        maxTurns: 4,
        model: DEFAULT_MODEL,
        outputFormat: SEARCH_OUTPUT_FORMAT,
        permissionMode: "dontAsk",
        tools: ["WebSearch"],
        allowedTools: ["WebSearch"]
      }
    });
    const payload = extractStructuredJson<SearchPayload>(result);
    const discoveredAt = new Date().toISOString();

    return payload.results.map((item) => ({
      title: item.title.trim(),
      url: item.url.trim(),
      snippet: item.snippet.trim(),
      discoveredAt,
      language: queryPlan.language
    }));
  }
}

export class ClaudeCodeFetcher {
  constructor(
    private readonly cache: FileCache,
    private readonly runQuery: ClaudeQueryFn = query
  ) {}

  async fetch(result: SearchResult): Promise<SourceDocument> {
    const normalizedUrl = normalizeUrl(result.url);
    const cacheKey = this.cache.createKey([normalizedUrl]);
    const cached = await this.cache.get<SourceDocument>("fetch", cacheKey, CACHE_VERSIONS.fetch);
    if (cached) {
      return cached;
    }

    const fetchResult = await runClaudeQuery(this.runQuery, {
      prompt: buildFetchPrompt(result.url),
      options: {
        cwd: process.cwd(),
        maxTurns: 4,
        model: DEFAULT_MODEL,
        outputFormat: FETCH_OUTPUT_FORMAT,
        permissionMode: "dontAsk",
        tools: ["WebFetch"],
        allowedTools: ["WebFetch"]
      }
    });
    const payload = extractStructuredJson<FetchPayload>(fetchResult);
    const sourceType = classifySourceType(normalizedUrl);
    const publishedAt = normalizePublishedAt(payload.publishedAt);
    const document: SourceDocument = {
      url: result.url,
      normalizedUrl,
      title: payload.title?.trim() || result.title,
      fetchedAt: new Date().toISOString(),
      ...(result.discoveredAt ? { discoveredAt: result.discoveredAt } : {}),
      language: result.language,
      html: payload.content || payload.text,
      text: payload.text.trim(),
      sourceType,
      ...(publishedAt ? { publishedAt } : {}),
      trustScore: trustScoreForSourceType(sourceType)
    };
    await this.cache.set("fetch", cacheKey, CACHE_VERSIONS.fetch, document);
    return document;
  }
}

function buildSearchPrompt(queryPlan: QueryPlan): string {
  return [
    `Use WebSearch to search for this query: ${queryPlan.query}`,
    "Return JSON only.",
    "Return up to 10 results in the shape { results: [{ title, url, snippet }] }.",
    "Do not invent URLs or snippets.",
    "Prefer direct result links over redirects when available."
  ].join("\n");
}

function buildFetchPrompt(url: string): string {
  return [
    `Use WebFetch to fetch this URL: ${url}`,
    "Return JSON only.",
    "Return the shape { title?, text, content?, publishedAt? }.",
    "text should contain the main readable page content as plain text.",
    "content may contain the fetched page content if available.",
    "publishedAt should be an ISO-8601 timestamp when present; otherwise omit it.",
    "Do not invent fields that are not supported by the fetched page."
  ].join("\n");
}

function normalizeUrl(input: string): string {
  const url = new URL(input);
  const paramsToDrop = [...url.searchParams.keys()].filter(
    (key) => key.startsWith("utm_") || key === "ref" || key === "source"
  );
  for (const key of paramsToDrop) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  return url.toString();
}

function normalizePublishedAt(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function classifySourceType(url: string): SourceType {
  if (/glassdoor|blind|reddit|teamblind|kununu/i.test(url)) {
    return "community";
  }
  if (/gov|sec\.gov|osha|eeoc|europa|court|tribunal/i.test(url)) {
    return "government";
  }
  if (/linkedin|wikipedia|crunchbase|pitchbook/i.test(url)) {
    return "directory";
  }
  if (/g2|capterra|trustpilot|sitejabber/i.test(url)) {
    return "review";
  }
  if (/careers|about|company|investor|press/i.test(url)) {
    return "official";
  }
  return "news";
}

function trustScoreForSourceType(sourceType: SourceType): number {
  switch (sourceType) {
    case "government":
      return 1;
    case "official":
      return 0.95;
    case "news":
      return 0.8;
    case "review":
      return 0.55;
    case "community":
      return 0.45;
    case "directory":
      return 0.5;
    default:
      return 0.35;
  }
}
