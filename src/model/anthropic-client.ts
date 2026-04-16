import { DEFAULT_MODEL } from "../config/constants.js";
import { RunLogger } from "../logging/run-logger.js";

export interface ModelClient {
  completeJson<T>(prompt: { system: string; user: string }): Promise<T>;
}

export class AnthropicClient implements ModelClient {
  constructor(private readonly logger: RunLogger) {}

  async completeJson<T>(prompt: { system: string; user: string }): Promise<T> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required.");
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1600,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }]
      })
    });
    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    }
    const body = (await response.json()) as {
      usage?: { input_tokens?: number; output_tokens?: number };
      content?: Array<{ type: string; text?: string }>;
    };
    this.logger.recordTokens(body.usage?.input_tokens || 0, body.usage?.output_tokens || 0);
    const text = body.content?.find((item) => item.type === "text")?.text;
    if (!text) {
      throw new Error("Anthropic response did not contain text output.");
    }
    return JSON.parse(extractJson(text)) as T;
  }
}

export class StubModelClient implements ModelClient {
  constructor(private readonly responder: (prompt: { system: string; user: string }) => unknown) {}

  async completeJson<T>(prompt: { system: string; user: string }): Promise<T> {
    return this.responder(prompt) as T;
  }
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}$/);
  return match ? match[0] : text;
}
