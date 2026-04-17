# Migration Plan: Direct API → Claude Code SDK

## Goal

Replace all external API dependencies with Claude Code SDK calls so users only need their Claude Code subscription — no `ANTHROPIC_API_KEY`, no search API key.

---

## What changes and why

Currently the pipeline has three external dependencies that require credentials or are fragile:

- `AnthropicClient` — calls Anthropic API directly, requires `ANTHROPIC_API_KEY`
- `SearchClient` — scrapes DuckDuckGo HTML, no auth but structurally fragile
- `Fetcher` — raw Node.js `fetch()`, no rate limiting or bot protection handling

All three get replaced with Claude Code SDK calls. The user's existing Claude subscription covers search, fetch, and model inference.

---

## Architecture: three interfaces, three new implementations

The orchestrator already abstracts its dependencies behind interfaces. No orchestrator logic changes — just different default constructors.

| Interface | Current impl | New impl |
|---|---|---|
| `ModelClient` | `AnthropicClient` (direct API) | `ClaudeCodeModelClient` (SDK) |
| `SearchService` | `SearchClient` (DuckDuckGo scrape) | `ClaudeCodeSearchClient` (WebSearch tool) |
| `FetchService` | `Fetcher` (raw fetch + cache) | `ClaudeCodeFetcher` (WebFetch tool) |

---

## New files

### `src/model/claude-code-client.ts`

Implements `ModelClient`.

- Calls `query()` from `@anthropic-ai/claude-code` SDK with the structured prompt
- Parses the text response as JSON (same extraction logic as current `AnthropicClient`)
- Forwards token usage to `logger.recordTokens(input, output, label)` if the SDK exposes it

### `src/retrieval/claude-code-web.ts`

Implements `SearchService` and `FetchService`.

**`ClaudeCodeSearchClient.search(query)`**
- Invokes the Claude Code SDK with a WebSearch tool call for `query.query`
- Parses the tool result into `SearchResult[]`

**`ClaudeCodeFetcher.fetch(result)`**
- Invokes the Claude Code SDK with a WebFetch tool call for `result.url`
- Wraps the response into a `SourceDocument`
- Cache layer (keyed by normalized URL) stays unchanged

---

## Changed files

### `src/report/orchestrator.ts`

Swap the three default implementations:

```ts
const searchClient = dependencies.searchClient || new ClaudeCodeSearchClient();
const fetcher      = dependencies.fetcher      || new ClaudeCodeFetcher(cache);
const model        = dependencies.model        || new ClaudeCodeModelClient(logger);
```

Remove the `AnthropicClient` import from the default path (keep it available for tests via `Dependencies`).

### `src/cli.ts`

- Remove API key check
- Add a startup check: verify `claude` CLI is present (`claude --version`), exit with a clear message if not

### `package.json`

- Add `@anthropic-ai/claude-code` to `dependencies`
- Remove direct `anthropic` SDK if no longer used outside tests

---

## What stays the same

- All three interfaces (`ModelClient`, `SearchService`, `FetchService`) — no signature changes
- Evidence pipeline, scoring, deduplication — untouched
- All section prompts — untouched
- Cache layer — untouched
- `renderFromJson` / HTML rendering — untouched
- `StubModelClient` in tests — untouched

---

## File summary

| File | Action |
|---|---|
| `src/model/claude-code-client.ts` | New — `ClaudeCodeModelClient` |
| `src/retrieval/claude-code-web.ts` | New — `ClaudeCodeSearchClient`, `ClaudeCodeFetcher` |
| `src/report/orchestrator.ts` | Swap default implementations |
| `src/cli.ts` | Remove API key check, add Claude Code presence check |
| `package.json` | Add `@anthropic-ai/claude-code` dependency |
| `README.md` | Update requirements section (no API keys needed) |
