import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildLegalPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("legal_regulatory", "Legal & Regulatory", packet, [
    "Include an informational legal disclaimer even when evidence is sparse.",
    "Treat ongoing, unresolved, or active matters as materially relevant even if older than 24 months."
  ]);
}
