import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildFinancePrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("financial_health", "Financial Health", packet, [
    "Always provide plainEnglishFinanceText.",
    "Use timelineItems for funding rounds if present."
  ]);
}
