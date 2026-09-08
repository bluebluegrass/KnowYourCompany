import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const sourceTests = (await readdir("tests"))
  .filter((file) => file.endsWith(".test.ts"))
  .sort()
  .map((file) => `dist/tests/${file.replace(/\.ts$/, ".js")}`);

if (!sourceTests.length) {
  throw new Error("No TypeScript test files were found in tests/.");
}

const result = spawnSync(process.execPath, ["--test", ...sourceTests], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
