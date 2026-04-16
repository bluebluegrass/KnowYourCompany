import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildCulturePrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("company_culture", "Company Culture", packet, [
    "Include a disclaimer that community-sourced culture data is self-reported and unverified.",
    "Use ratings[] when community rating metrics are available."
  ]);
}
