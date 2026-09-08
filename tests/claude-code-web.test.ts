import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileCache } from "../src/cache/file-cache.js";
import { RunLogger } from "../src/logging/run-logger.js";
import { ClaudeCodeFetcher, ClaudeCodeSearchClient } from "../src/retrieval/claude-code-web.js";

test("ClaudeCodeSearchClient maps structured search output into SearchResult[]", async () => {
  const client = new ClaudeCodeSearchClient(async function* () {
    yield {
      type: "result",
      subtype: "success",
      duration_ms: 1,
      duration_api_ms: 1,
      is_error: false,
      api_error_status: null,
      num_turns: 1,
      result: '{"results":[{"title":"Acme","url":"https://example.com","snippet":"Snippet"}]}',
      structured_output: {
        results: [{ title: "Acme", url: "https://example.com", snippet: "Snippet" }]
      },
      stop_reason: null,
      total_cost_usd: 0,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
        server_tool_use: { web_search_requests: 1 },
        service_tier: "standard"
      },
      modelUsage: {},
      permission_denials: [],
      uuid: "00000000-0000-0000-0000-000000000000",
      session_id: "session"
    } as any;
  } as any);

  const results = await client.search({
    sectionId: "financial_health",
    query: "Acme funding",
    language: "en",
    priority: 0,
    reason: "default-search"
  });

  assert.equal(results.length, 1);
  assert.equal(results[0]?.title, "Acme");
  assert.equal(results[0]?.url, "https://example.com");
  assert.equal(results[0]?.language, "en");
});

test("ClaudeCodeFetcher preserves fetch caching and source mapping", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "bg-check-claude-fetch-"));
  const cache = new FileCache(tempDir, new RunLogger());
  let calls = 0;
  const fetcher = new ClaudeCodeFetcher(
    cache,
    async function* () {
      calls += 1;
      yield {
        type: "result",
        subtype: "success",
        duration_ms: 1,
        duration_api_ms: 1,
        is_error: false,
        api_error_status: null,
        num_turns: 1,
        result: '{"title":"About Acme","text":"Acme company profile","content":"<html>Acme</html>","publishedAt":"2026-01-01T00:00:00.000Z"}',
        structured_output: {
          title: "About Acme",
          text: "Acme company profile",
          content: "<html>Acme</html>",
          publishedAt: "2026-01-01T00:00:00.000Z"
        },
        stop_reason: null,
        total_cost_usd: 0,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
          server_tool_use: { web_search_requests: 0 },
          service_tier: "standard"
        },
        modelUsage: {},
        permission_denials: [],
        uuid: "00000000-0000-0000-0000-000000000000",
        session_id: "session"
      } as any;
    } as any
  );

  const searchResult = {
    title: "Acme",
    url: "https://example.com/about?utm_source=test",
    snippet: "Snippet",
    discoveredAt: "2026-04-17T00:00:00.000Z",
    language: "en"
  };

  const first = await fetcher.fetch(searchResult);
  const second = await fetcher.fetch(searchResult);

  assert.equal(calls, 1);
  assert.equal(first.normalizedUrl, "https://example.com/about");
  assert.equal(first.sourceType, "official");
  assert.equal(first.trustScore, 0.95);
  assert.equal(first.text, "Acme company profile");
  assert.equal(first.html, "<html>Acme</html>");
  assert.equal(first.publishedAt, "2026-01-01T00:00:00.000Z");
  assert.deepEqual(second, first);
});
