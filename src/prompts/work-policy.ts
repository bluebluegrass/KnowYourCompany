import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildWorkPolicyPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("work_policy", "Remote / Hybrid / RTO Policy", packet, [
    "Separate official policy from employee sentiment in keyFindings."
  ]);
}
