import test from "node:test";
import assert from "node:assert/strict";
import { ensureResearchRuntimeAvailable, getClaudeCodeStatus, inferLocalLanguage, parseArgs } from "../src/cli.js";

test("parseArgs supports render and full modes", () => {
  assert.deepEqual(parseArgs(["--render", "report.json", "--outputDir", "/tmp/out"]), {
    render: "report.json",
    outputDir: "/tmp/out"
  });
  assert.deepEqual(parseArgs(["--full", "--company", "Acme"]), {
    full: "true",
    company: "Acme"
  });
});

test("inferLocalLanguage preserves current location heuristics", () => {
  assert.equal(inferLocalLanguage("Amsterdam"), "nl");
  assert.equal(inferLocalLanguage("Berlin"), "de");
  assert.equal(inferLocalLanguage("Remote"), "en");
});

test("getClaudeCodeStatus reports unauthenticated Claude Code clearly", async () => {
  const status = await getClaudeCodeStatus(async (_file, args) => {
    if (args[0] === "--version") {
      return { stdout: "2.1.110 (Claude Code)\n", stderr: "" };
    }
    throw {
      stdout: JSON.stringify({ loggedIn: false, authMethod: "none", apiProvider: "firstParty" }),
      stderr: ""
    };
  });

  assert.equal(status.available, true);
  assert.equal(status.authenticated, false);
  assert.match(status.message, /claude auth login/i);
});

test("ensureResearchRuntimeAvailable skips Claude checks for render-only mode", async () => {
  let callCount = 0;
  await assert.doesNotReject(() =>
    ensureResearchRuntimeAvailable(
      { render: "report.json" },
      async () => {
        callCount += 1;
        return { stdout: "", stderr: "" };
      }
    )
  );
  assert.equal(callCount, 0);
});
