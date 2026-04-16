import type { QueryPlan, SearchResult } from "../types/index.js";

export class SearchClient {
  async search(query: QueryPlan): Promise<SearchResult[]> {
    const url = new URL("https://duckduckgo.com/html/");
    url.searchParams.set("q", query.query);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "KnowYourCompany/0.1 (+https://example.invalid)"
      }
    });
    if (!response.ok) {
      throw new Error(`Search failed for query "${query.query}" with ${response.status}`);
    }
    const html = await response.text();
    return parseDuckDuckGoResults(html, query.language);
  }
}

function parseDuckDuckGoResults(html: string, language: string): SearchResult[] {
  const results: SearchResult[] = [];
  const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(regex)) {
    const [, url, rawTitle, rawSnippet] = match;
    if (!url || !rawTitle || !rawSnippet) {
      continue;
    }
    results.push({
      title: stripTags(rawTitle),
      url,
      snippet: stripTags(rawSnippet),
      discoveredAt: new Date().toISOString(),
      language
    });
  }
  return results;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
