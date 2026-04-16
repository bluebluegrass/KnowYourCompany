import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildCompensationPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("compensation_benefits", "Compensation & Benefits", packet, [
    "Include a disclaimer that salary and equity data from community sources is self-reported and unverified."
  ]);
}
