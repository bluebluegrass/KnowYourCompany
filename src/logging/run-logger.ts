import type { RunMetrics, SectionId } from "../types/index.js";

export class RunLogger {
  readonly metrics: RunMetrics = {
    cacheHits: {},
    cacheMisses: {},
    tokensIn: 0,
    tokensOut: 0,
    perStepTokens: {},
    perSectionLatencyMs: {},
    perSectionEvidenceSent: {},
    searchCount: {},
    retrievedCount: {},
    dedupedCount: {}
  };

  info(message: string, details?: Record<string, unknown>): void {
    const payload = details ? ` ${JSON.stringify(details)}` : "";
    console.log(`[info] ${message}${payload}`);
  }

  recordCache(layer: string, hit: boolean): void {
    const target = hit ? this.metrics.cacheHits : this.metrics.cacheMisses;
    target[layer] = (target[layer] || 0) + 1;
  }

  recordTokens(input: number, output: number, label?: string): void {
    this.metrics.tokensIn += input;
    this.metrics.tokensOut += output;
    if (label) {
      const step = this.metrics.perStepTokens[label] ?? { in: 0, out: 0 };
      step.in += input;
      step.out += output;
      this.metrics.perStepTokens[label] = step;
      this.info(`tokens [${label}]`, { in: input, out: output, totalIn: step.in, totalOut: step.out });
    }
  }

  recordSectionLatency(sectionId: SectionId, latencyMs: number): void {
    this.metrics.perSectionLatencyMs[sectionId] = latencyMs;
  }

  recordSectionEvidence(sectionId: SectionId, count: number): void {
    this.metrics.perSectionEvidenceSent[sectionId] = count;
  }

  recordSearchCount(sectionId: SectionId, count: number): void {
    this.metrics.searchCount[sectionId] = count;
  }

  recordRetrievedCount(sectionId: SectionId, count: number): void {
    this.metrics.retrievedCount[sectionId] = count;
  }

  recordDedupedCount(sectionId: SectionId, count: number): void {
    this.metrics.dedupedCount[sectionId] = count;
  }
}
