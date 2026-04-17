import test from "node:test";
import assert from "node:assert/strict";
import { RunLogger } from "../src/logging/run-logger.js";
import { ClaudeCodeModelClient } from "../src/model/claude-code-client.js";

test("ClaudeCodeModelClient parses trailing JSON from result text", async () => {
  const client = new ClaudeCodeModelClient(new RunLogger(), async function* () {
    yield {
      type: "result",
      subtype: "success",
      duration_ms: 1,
      duration_api_ms: 1,
      is_error: false,
      api_error_status: null,
      num_turns: 1,
      result: 'Intro text\n{"answer":"ok"}',
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
  } as any);

  const result = await client.completeJson<{ answer: string }>({ system: "Return JSON.", user: "Say ok." });
  assert.deepEqual(result, { answer: "ok" });
});

test("ClaudeCodeModelClient throws on malformed JSON output", async () => {
  const client = new ClaudeCodeModelClient(new RunLogger(), async function* () {
    yield {
      type: "result",
      subtype: "success",
      duration_ms: 1,
      duration_api_ms: 1,
      is_error: false,
      api_error_status: null,
      num_turns: 1,
      result: "not-json",
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
  } as any);

  await assert.rejects(() => client.completeJson({ system: "Return JSON.", user: "Say ok." }), /JSON object/);
});
