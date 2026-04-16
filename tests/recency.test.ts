import test from "node:test";
import assert from "node:assert/strict";
import { recencyReason, shouldIncludeByRecency } from "../src/retrieval/recency.js";

test("time-sensitive sections default to 24 month window", () => {
  assert.equal(shouldIncludeByRecency("layoffs", "2025-01-01T00:00:00.000Z", "2026-04-16T00:00:00.000Z"), true);
  assert.equal(shouldIncludeByRecency("layoffs", "2023-01-01T00:00:00.000Z", "2026-04-16T00:00:00.000Z"), false);
});

test("company profile bypasses strict recency cap", () => {
  assert.equal(shouldIncludeByRecency("company_profile_history", "2018-01-01T00:00:00.000Z", "2026-04-16T00:00:00.000Z"), true);
});

test("legal exceptions keep older active matters", () => {
  assert.equal(shouldIncludeByRecency("legal_regulatory", "2020-01-01T00:00:00.000Z", "2026-04-16T00:00:00.000Z", true), true);
  assert.equal(recencyReason("legal_regulatory", "2020-01-01T00:00:00.000Z", "2026-04-16T00:00:00.000Z", true), "exception-material-current-risk");
});
