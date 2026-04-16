import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { FileCache } from "../src/cache/file-cache.js";
import { RunLogger } from "../src/logging/run-logger.js";

test("file cache respects version invalidation", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "kyc-cache-"));
  const logger = new RunLogger();
  const cache = new FileCache(dir, logger);
  const key = cache.createKey(["company", "section"]);
  await cache.set("layer", key, "v1", { ok: true });
  assert.deepEqual(await cache.get("layer", key, "v1"), { ok: true });
  assert.equal(await cache.get("layer", key, "v2"), undefined);
});
