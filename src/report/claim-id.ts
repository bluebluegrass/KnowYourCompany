import { createHash } from "node:crypto";
import type { ClaimScope, SectionId } from "../types/index.js";

export function buildClaimId(sectionId: SectionId, text: string, scope: ClaimScope): string {
  const subject = text.toLowerCase().replace(/\d+/g, "#").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  const scopeKey = [scope.location, scope.role, scope.employmentType].filter(Boolean).join("|").toLowerCase();
  const hash = createHash("sha256").update(`${sectionId}|${scopeKey}|${subject}`).digest("hex").slice(0, 10);
  return `${sectionId}:${subject || "finding"}:${hash}`;
}
