import { createHash } from "node:crypto";
import type { SearchResult, SourceDocument, SourceType } from "../types/index.js";
import { CACHE_VERSIONS } from "../config/constants.js";
import { FileCache } from "../cache/file-cache.js";
import { normalizeUrl } from "../evidence/source-normalizer.js";

export class Fetcher {
  constructor(private readonly cache: FileCache) {}

  async fetch(result: SearchResult): Promise<SourceDocument> {
    const normalizedUrl = normalizeUrl(result.url);
    const cacheKey = this.cache.createKey([normalizedUrl]);
    const cached = await this.cache.get<SourceDocument>("fetch", cacheKey, CACHE_VERSIONS.fetch);
    if (cached) {
      return cached;
    }

    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "KnowYourCompany/0.1 (+https://example.invalid)"
      }
    });
    if (!response.ok) {
      throw new Error(`Fetch failed for ${normalizedUrl}: ${response.status}`);
    }
    const html = await response.text();
    const text = cleanHtmlToText(html);
    const publishedAt = extractPublishedAt(html);
    const sourceType = classifySourceType(normalizedUrl);
    const document: SourceDocument = {
      url: result.url,
      normalizedUrl,
      title: result.title,
      fetchedAt: new Date().toISOString(),
      ...(result.discoveredAt ? { discoveredAt: result.discoveredAt } : {}),
      language: result.language,
      html,
      text,
      sourceType,
      ...(publishedAt ? { publishedAt } : {}),
      trustScore: trustScoreForSourceType(sourceType)
    };
    await this.cache.set("fetch", cacheKey, CACHE_VERSIONS.fetch, document);
    return document;
  }
}

export function cleanHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPublishedAt(html: string): string | undefined {
  const candidates = [
    /datetime="([^"]+)"/i,
    /"datePublished":"([^"]+)"/i,
    /property="article:published_time" content="([^"]+)"/i
  ];
  for (const candidate of candidates) {
    const match = html.match(candidate);
    if (match?.[1]) {
      return new Date(match[1]).toISOString();
    }
  }
  return undefined;
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

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
