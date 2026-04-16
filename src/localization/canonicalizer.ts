import type { EvidencePacket } from "../types/index.js";
import type { Translator } from "./translator.js";

export async function normalizeEvidenceToCanonicalLanguage(
  packet: EvidencePacket,
  canonicalLanguage: string,
  _translator: Translator
): Promise<EvidencePacket> {
  if (canonicalLanguage.toLowerCase() === "english") {
    return packet;
  }
  return packet;
}
