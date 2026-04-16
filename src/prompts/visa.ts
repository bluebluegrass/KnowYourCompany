import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildVisaPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("visa_sponsorship", "Visa & Immigration Sponsorship", packet, [
    "Use country-specific language when location evidence supports it rather than generic visa wording."
  ]);
}
