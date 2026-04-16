import { buildSectionPrompt, type PromptSpec } from "./base.js";
import type { EvidencePacket } from "../types/index.js";

export function buildProductHealthPrompt(packet: EvidencePacket): PromptSpec {
  return buildSectionPrompt("product_market_health", "Product & Market Health", packet, [
    "Use ratings[] when review platform metrics are available."
  ]);
}
