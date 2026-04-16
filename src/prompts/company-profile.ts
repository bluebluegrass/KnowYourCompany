import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildCompanyProfilePrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("company_profile_history", "Company Profile & History", packet, [
    "Prefer durable official and background sources; no strict 24 month cap applies."
  ]);
}
