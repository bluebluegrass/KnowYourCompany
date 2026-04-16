import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildLeadershipPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("leadership_stability", "Leadership Stability", packet, [
    "Flag red for abrupt CEO/CTO removal or multiple key exits in a short period."
  ]);
}
