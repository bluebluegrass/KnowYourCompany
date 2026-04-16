import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildFounderBackgroundPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("founder_background", "Founder Background", packet, [
    "Older sources may be used for durable biography facts, but recent developments should dominate current-risk analysis."
  ]);
}
