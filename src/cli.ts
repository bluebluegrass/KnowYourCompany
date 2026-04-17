import path from "node:path";
import { execFile as nodeExecFile } from "node:child_process";
import readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { stdin as input, stdout as output } from "node:process";
import { runReport } from "./report/orchestrator.js";
import { renderFromJson } from "./render/report-renderer.js";

interface CliArgs {
  company?: string;
  full?: string;
  location?: string;
  outputDir?: string;
  render?: string;
  role?: string;
}

interface ClaudeStatus {
  authenticated: boolean;
  available: boolean;
  message: string;
}

type ExecFileLike = (file: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;
const execFileAsync = promisify(nodeExecFile);

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.render) {
    await runRenderMode(args.render, args.outputDir);
    return;
  }

  await ensureResearchRuntimeAvailable(args);

  const rl = readline.createInterface({ input, output });
  try {
    const inputContext = await readResearchInput(args, rl);
    await runResearchMode(args, inputContext);
  } finally {
    rl.close();
  }
}

async function runRenderMode(jsonPath: string, outputDir?: string): Promise<void> {
  const result = await renderFromJson(jsonPath, outputDir);
  console.log(`HTML saved as ${path.basename(result.outputPath)}.`);
}

async function readResearchInput(args: CliArgs, rl: readline.Interface): Promise<{ company: string; location: string; role: string }> {
  const company = args.company || (await rl.question("What company would you like to research? "));
  const location = args.location || (await rl.question("Which office location are you considering? (optional) "));
  const role = args.role || (await rl.question("What role are you considering? (optional) "));

  if (!company.trim()) {
    throw new Error("Company name is required.");
  }

  return {
    company: company.trim(),
    location: location.trim(),
    role: role.trim()
  };
}

async function runResearchMode(args: CliArgs, inputContext: { company: string; location: string; role: string }): Promise<void> {
  const reportResult = await runReport({
    company: inputContext.company,
    ...(inputContext.location ? { location: inputContext.location } : {}),
    ...(inputContext.role ? { role: inputContext.role } : {}),
    localLanguage: inferLocalLanguage(inputContext.location),
    outputDir: args.outputDir || process.cwd()
  });

  console.log(`Report JSON saved as ${path.basename(reportResult.jsonPath)}.`);
  console.log(JSON.stringify(reportResult.logger.metrics, null, 2));

  if (args.full === "true") {
    await runRenderMode(reportResult.jsonPath, args.outputDir);
  }
}

export async function ensureResearchRuntimeAvailable(
  args: CliArgs,
  execFileRunner: ExecFileLike = execFileRunnerDefault
): Promise<void> {
  if (args.render) {
    return;
  }
  const status = await getClaudeCodeStatus(execFileRunner);
  if (!status.available || !status.authenticated) {
    throw new Error(status.message);
  }
}

export function parseArgs(args: string[]): CliArgs {
  const parsed: CliArgs = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token?.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = args[index + 1];
    if (value && !value.startsWith("--")) {
      parsed[key as keyof CliArgs] = value;
      index += 1;
    } else {
      parsed[key as keyof CliArgs] = "true";
    }
  }
  return parsed;
}

export function inferLocalLanguage(location?: string): string {
  const value = (location || "").toLowerCase();
  if (/netherlands|amsterdam|rotterdam|utrecht/.test(value)) {
    return "nl";
  }
  if (/germany|berlin|munich|hamburg/.test(value)) {
    return "de";
  }
  if (/france|paris|lyon/.test(value)) {
    return "fr";
  }
  if (/japan|tokyo|osaka/.test(value)) {
    return "ja";
  }
  if (/spain|madrid|barcelona/.test(value)) {
    return "es";
  }
  if (/brazil|sao paulo|rio/.test(value)) {
    return "pt";
  }
  return "en";
}

export async function getClaudeCodeStatus(
  execFileRunner: ExecFileLike = execFileRunnerDefault
): Promise<ClaudeStatus> {
  try {
    await execFileRunner("claude", ["--version"]);
  } catch {
    return {
      available: false,
      authenticated: false,
      message: "Claude Code is not installed or not on PATH. Install it and run `claude auth login` before using research mode."
    };
  }

  try {
    const { stdout } = await execFileRunner("claude", ["auth", "status", "--json"]);
    return parseClaudeAuthStatus(stdout);
  } catch (error) {
    const stdout = readExecStdout(error);
    if (stdout) {
      return parseClaudeAuthStatus(stdout);
    }
    return {
      available: true,
      authenticated: false,
      message: "Claude Code is installed, but auth status could not be determined. Run `claude auth login` and try again."
    };
  }
}

export function parseClaudeAuthStatus(stdout: string): ClaudeStatus {
  let payload: unknown;
  try {
    payload = JSON.parse(stdout);
  } catch {
    return {
      available: true,
      authenticated: false,
      message: "Claude Code returned an unreadable auth status response. Run `claude auth login` and try again."
    };
  }

  const value = payload as { loggedIn?: boolean };
  if (value.loggedIn === true) {
    return {
      available: true,
      authenticated: true,
      message: "Claude Code is ready."
    };
  }

  return {
    available: true,
    authenticated: false,
    message: "Claude Code is installed but not authenticated. Run `claude auth login` before using research mode."
  };
}

function execFileRunnerDefault(file: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(file, args, { encoding: "utf8" }) as Promise<{ stdout: string; stderr: string }>;
}

function readExecStdout(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const value = error as { stdout?: unknown };
  return typeof value.stdout === "string" ? value.stdout : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
