import { query, type SDKResultMessage, type SDKResultSuccess } from "@anthropic-ai/claude-agent-sdk";
import { DEFAULT_MODEL } from "../config/constants.js";
import { RunLogger } from "../logging/run-logger.js";
import type { ModelClient } from "./anthropic-client.js";

export type ClaudeQueryFn = typeof query;

export class ClaudeCodeModelClient implements ModelClient {
  constructor(
    private readonly logger: RunLogger,
    private readonly runQuery: ClaudeQueryFn = query
  ) {}

  async completeJson<T>(prompt: { system: string; user: string }, label?: string): Promise<T> {
    const result = await runClaudeQuery(this.runQuery, {
      prompt: buildModelPrompt(prompt),
      options: {
        cwd: process.cwd(),
        maxTurns: 1,
        model: DEFAULT_MODEL,
        permissionMode: "dontAsk",
        tools: []
      }
    });
    recordTokens(this.logger, result, label);
    return JSON.parse(extractJson(result.result)) as T;
  }
}

export async function runClaudeQuery(
  runQuery: ClaudeQueryFn,
  params: Parameters<ClaudeQueryFn>[0]
): Promise<SDKResultSuccess> {
  let finalResult: SDKResultMessage | undefined;

  for await (const message of runQuery(params)) {
    if (message.type === "result") {
      finalResult = message;
    }
  }

  if (!finalResult) {
    throw new Error("Claude Agent SDK did not return a result message.");
  }

  if (finalResult.subtype !== "success") {
    throw new Error(`Claude Agent SDK query failed: ${finalResult.errors.join("; ") || finalResult.subtype}`);
  }

  return finalResult;
}

export function extractStructuredJson<T>(result: SDKResultMessage): T {
  if (result.subtype !== "success") {
    throw new Error("Structured output is only available for successful Claude Agent SDK results.");
  }

  if (result.structured_output !== undefined) {
    return result.structured_output as T;
  }

  return JSON.parse(extractJson(result.result)) as T;
}

function buildModelPrompt(prompt: { system: string; user: string }): string {
  return [
    "<SYSTEM>",
    prompt.system,
    "</SYSTEM>",
    "",
    "<USER>",
    prompt.user,
    "</USER>"
  ].join("\n");
}

function recordTokens(logger: RunLogger, result: SDKResultMessage, label?: string): void {
  if (result.subtype !== "success") {
    return;
  }
  logger.recordTokens(result.usage.input_tokens, result.usage.output_tokens, label);
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}$/);
  if (!match) {
    throw new Error("Claude Agent SDK response did not contain a JSON object.");
  }
  return match[0];
}
