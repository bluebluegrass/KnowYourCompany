import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildLayoffsPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("layoffs", "Recent Layoffs", packet, [
    "Flag red when layoffs above 10% in the past 6 months or repeated reductions signal instability."
  ]);
}
