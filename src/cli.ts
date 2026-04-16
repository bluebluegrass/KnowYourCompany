import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runReport } from "./report/orchestrator.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rl = readline.createInterface({ input, output });
  const company = args.company || (await rl.question("What company would you like to research? "));
  const location = args.location || (await rl.question("Which office location are you considering? (optional) "));
  const role = args.role || (await rl.question("What role are you considering? (optional) "));
  const outputLanguage = args.language || (await rl.question("What language should the report be written in? (default: English) "));
  rl.close();

  if (!company.trim()) {
    throw new Error("Company name is required.");
  }

  const result = await runReport({
    company: company.trim(),
    ...(location.trim() ? { location: location.trim() } : {}),
    ...(role.trim() ? { role: role.trim() } : {}),
    outputLanguage: outputLanguage.trim() || "English",
    localLanguage: inferLocalLanguage(location),
    outputDir: args.outputDir || process.cwd()
  });

  console.log(`Report saved as ${path.basename(result.outputPath)}.`);
  console.log(JSON.stringify(result.logger.metrics, null, 2));
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token?.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = args[index + 1];
    if (value && !value.startsWith("--")) {
      parsed[key] = value;
      index += 1;
    } else {
      parsed[key] = "true";
    }
  }
  return parsed;
}

function inferLocalLanguage(location?: string): string {
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
