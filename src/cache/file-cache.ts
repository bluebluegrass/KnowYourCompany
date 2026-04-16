import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CacheEntry } from "../types/index.js";
import { RunLogger } from "../logging/run-logger.js";

export class FileCache {
  constructor(
    private readonly rootDir: string,
    private readonly logger: RunLogger
  ) {}

  async get<T>(layer: string, key: string, version: string): Promise<T | undefined> {
    const filePath = this.resolvePath(layer, key);
    try {
      const raw = await readFile(filePath, "utf8");
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (entry.version !== version) {
        this.logger.recordCache(layer, false);
        return undefined;
      }
      this.logger.recordCache(layer, true);
      return entry.value;
    } catch {
      this.logger.recordCache(layer, false);
      return undefined;
    }
  }

  async set<T>(layer: string, key: string, version: string, value: T): Promise<void> {
    const filePath = this.resolvePath(layer, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    const entry: CacheEntry<T> = {
      storedAt: new Date().toISOString(),
      version,
      value
    };
    await writeFile(filePath, JSON.stringify(entry, null, 2), "utf8");
  }

  createKey(parts: readonly string[]): string {
    const hash = createHash("sha256");
    for (const part of parts) {
      hash.update(part);
      hash.update("\u0000");
    }
    return hash.digest("hex");
  }

  private resolvePath(layer: string, key: string): string {
    return path.join(this.rootDir, layer, `${key}.json`);
  }
}
