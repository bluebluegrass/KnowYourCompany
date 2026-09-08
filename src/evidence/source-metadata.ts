import type { SourceDocument, SourceTier, SourceType } from "../types/index.js";

export function sourceMetadata(url: string): Pick<SourceDocument, "sourceType" | "sourceTier" | "publisher" | "accessState"> {
  const hostname = new URL(url).hostname.toLowerCase();
  const normalized = url.toLowerCase();
  const publisher = hostname.replace(/^www\./, "");
  if (/glassdoor|blind|reddit|teamblind|kununu/.test(hostname)) return { sourceType: "community", sourceTier: "community", publisher, accessState: "fetched" };
  if (/\.gov$|\.gov\.|sec\.gov|osha|eeoc|europa\.eu|court|tribunal/.test(hostname)) return { sourceType: "government", sourceTier: "authoritative", publisher, accessState: "fetched" };
  if (/linkedin|wikipedia|crunchbase|pitchbook|levels\.fyi|myvisajobs/.test(hostname)) return { sourceType: "directory", sourceTier: "aggregator", publisher, accessState: "fetched" };
  if (/g2|capterra|trustpilot|sitejabber/.test(hostname)) return { sourceType: "review", sourceTier: "aggregator", publisher, accessState: "fetched" };
  if (/careers|jobs|investor|press|ir\.|about/.test(normalized)) return { sourceType: "official", sourceTier: "primary", publisher, accessState: "fetched" };
  return { sourceType: "news", sourceTier: "reputable", publisher, accessState: "fetched" };
}

export function trustScoreForTier(tier: SourceTier): number {
  return { primary: 0.95, authoritative: 1, reputable: 0.8, community: 0.45, aggregator: 0.5 }[tier];
}
