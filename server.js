import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createResearchPrompt,
  getResponseJsonSchema,
  makeDownloadFilename,
  normalizeReport,
  renderFullReportHtml,
} from "./lib/report-template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
await loadDotEnv(path.join(__dirname, ".env"));

const publicDir = path.join(__dirname, "public");
const port = Number.parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "127.0.0.1";
const model = process.env.OPENAI_MODEL || "gpt-5";

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/research") {
      await handleResearch(req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, {
      error: "internal_error",
      message: "Unexpected server error.",
    });
  }
});

server.listen(port, host, () => {
  console.log(`KnowYourCompany app listening on http://${host}:${port}`);
});

async function handleResearch(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 500, {
      error: "missing_api_key",
      message: "Set OPENAI_API_KEY before running the app.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const inputs = {
    company: sanitizeInput(body.company),
    location: sanitizeInput(body.location),
    role: sanitizeInput(body.role),
    outputLanguage: sanitizeInput(body.outputLanguage) || "English",
  };

  if (!inputs.company) {
    sendJson(res, 400, {
      error: "validation_error",
      message: "Company name is required.",
    });
    return;
  }

  const payload = {
    model,
    reasoning: { effort: "medium" },
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    include: ["web_search_call.action.sources"],
    input: createResearchPrompt(inputs),
    text: {
      format: {
        type: "json_schema",
        ...getResponseJsonSchema(),
      },
    },
  };

  let response;
  let responseBody;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    responseBody = await response.json();
  } catch (error) {
    sendJson(res, 502, {
      error: "openai_unreachable",
      message: error.name === "TimeoutError"
        ? "The OpenAI request timed out after 60 seconds."
        : "The server could not reach OpenAI. Check network access and API credentials.",
    });
    return;
  }

  if (!response.ok) {
    sendJson(res, response.status, {
      error: "openai_error",
      message: responseBody?.error?.message || "OpenAI request failed.",
    });
    return;
  }

  const parsed = extractStructuredJson(responseBody);
  const report = normalizeReport(parsed, inputs);
  const html = renderFullReportHtml(report);

  sendJson(res, 200, {
    report,
    html,
    filename: makeDownloadFilename(report.company),
  });
}

async function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  let content;
  try {
    content = await readFile(filePath);
  } catch {
    sendText(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  sendBuffer(res, 200, content, contentType(filePath));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function extractStructuredJson(responseBody) {
  if (typeof responseBody.output_text === "string" && responseBody.output_text.trim()) {
    return JSON.parse(responseBody.output_text);
  }

  for (const item of responseBody.output || []) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string" && content.text.trim()) {
        return JSON.parse(content.text);
      }
    }
  }

  throw new Error("OpenAI response did not contain structured JSON output.");
}

function sanitizeInput(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sendJson(res, status, payload) {
  sendBuffer(res, status, Buffer.from(JSON.stringify(payload)), "application/json; charset=utf-8");
}

function sendText(res, status, payload, type) {
  sendBuffer(res, status, Buffer.from(payload), type);
}

function sendBuffer(res, status, payload, type) {
  res.writeHead(status, { "Content-Type": type });
  res.end(payload);
}

function contentType(filePath) {
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (filePath.endsWith(".png")) {
    return "image/png";
  }
  return "text/html; charset=utf-8";
}

async function loadDotEnv(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
