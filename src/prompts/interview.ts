import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildInterviewPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("interview_experience", "Interview Experience", packet, [
    "Include a disclaimer that interview reports are self-reported and unverified."
  ]);
}
