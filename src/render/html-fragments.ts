import type { Finding, RatingRow, SourceDocument, TimelineItem } from "../types/index.js";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function paragraphsFromText(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
}

export function findingsList(findings: Finding[]): string {
  if (!findings.length) {
    return "";
  }
  return `<ul>${findings.map((finding) => `<li>${escapeHtml(finding.text)}</li>`).join("")}</ul>`;
}

export function sourcesList(sourceRefs: string[], sources: Record<string, SourceDocument>): string {
  if (!sourceRefs.length) {
    return "<li>No sources found</li>";
  }
  const items = sourceRefs
    .map((sourceRef) => sources[sourceRef])
    .filter((source): source is SourceDocument => Boolean(source))
    .map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank">${escapeHtml(source.title)}</a></li>`);
  return items.length ? items.join("\n") : "<li>No sources found</li>";
}

export function disclaimersBlock(disclaimers: string[]): string {
  return disclaimers.map((disclaimer) => `<div class="disclaimer">${escapeHtml(disclaimer)}</div>`).join("\n");
}

export function ratingsBlock(ratings: RatingRow[]): string {
  return ratings
    .map(
      (rating) =>
        `<div class="rating-row">${rating.stars ? `<span class="stars">${escapeHtml(rating.stars)}</span>` : ""}<strong>${escapeHtml(rating.value)}</strong><span class="rating-label">${escapeHtml(rating.label)}</span></div>`
    )
    .join("\n");
}

export function timelineBlock(items: TimelineItem[]): string {
  return items
    .map(
      (item) =>
        `<div class="timeline-item"><span class="round">${escapeHtml(item.title)}</span><div class="round-meta">${escapeHtml(item.meta)}</div></div>`
    )
    .join("\n");
}
