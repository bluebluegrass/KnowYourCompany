import type { ActionItem, Claim, FinanceProfile, ReportV2, ReportV2Section, SourceDocument } from "../types/index.js";
import { escapeHtml, safeExternalUrl } from "./html-fragments.js";

type CheckStatus = "positive" | "verify" | "limited" | "concern";
interface StatusInfo { key: CheckStatus; label: "Positive" | "Verify" | "Limited data" | "Concern"; }

export function renderReportV2(report: ReportV2): string {
  const sections = report.sections;
  const research = sections.map((section, index) => sectionHtml(section, report.sources, report.actions, index + 1)).join("");
  const company = companySummary(report);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.target.company)} — Candidate Brief</title><style>${styles()}</style></head><body><main class="page"><header class="masthead"><div><p class="eyebrow">KnowYourCompany · candidate decision brief</p><h1>${escapeHtml(report.target.company)}</h1><p class="role">${escapeHtml([report.target.role, report.target.location].filter(Boolean).join(" · ") || "Company research brief")}</p>${company ? `<p class="company-summary">${escapeHtml(company)}</p>` : ""}</div><p class="stamp">PUBLIC-SOURCE REVIEW<br>PREPARED ${escapeHtml(report.generatedAt.slice(0, 10))}</p></header>${tableOfContents(sections)}<section class="decision" aria-labelledby="decision-title"><div><p class="eyebrow">5-second decision</p><p class="decision-label">Overall recommendation</p><h2 id="decision-title" class="recommendation ${escapeHtml(report.decision.recommendation.replaceAll("_", "-"))}">${escapeHtml(recommendationLabel(report.decision.recommendation))}</h2><p class="decision-why">${escapeHtml(decisionWhy(report.decision.rationale))}</p></div>${report.candidateProfile ? profileHtml(report) : ""}</section><article><section class="overview" aria-labelledby="checks-title"><div class="overview-head"><div><p class="eyebrow">30-second company check</p><h2 id="checks-title">12 company checks</h2></div>${statusSummary(sections)}</div><div class="check-grid">${sections.map(checkCard).join("") || "<p class=\"quiet\">No research areas were available.</p>"}</div></section>${questions(report.actions, sections)}<section class="all-research" id="all-research"><div class="research-heading"><p class="eyebrow">Deep research</p><h2>Evidence, context &amp; source links</h2><p>Detailed public record behind each check.</p></div><div class="research-body"><p class="research-note">Each section keeps its conclusion, unknowns, recommended question, and original source trail together.</p>${research}</div></section></article><footer>Public-information briefing only. Verify decision-critical details directly with the employer.</footer></main><script>${navigationScript()}</script></body></html>`;
}

function styles(): string {
  return `
:root{--paper:oklch(97% .011 82);--paper-deep:oklch(93% .018 82);--ink:oklch(23% .023 252);--muted:oklch(48% .02 252);--line:oklch(79% .018 82);--blue:oklch(42% .104 249);--blue-wash:oklch(93% .027 249);--green:oklch(43% .095 151);--green-wash:oklch(94% .03 151);--amber:oklch(54% .105 72);--amber-wash:oklch(95% .035 78);--red:oklch(47% .13 28);--red-wash:oklch(94% .032 28);--grey:oklch(48% .014 252);--grey-wash:oklch(93% .009 252);--sans:"Avenir Next","Helvetica Neue",Helvetica,sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.48 var(--sans)}.page{width:min(1140px,100%);margin:auto;padding:clamp(20px,4.5vw,64px) clamp(16px,4vw,48px) 86px}.masthead{display:flex;justify-content:space-between;align-items:start;gap:24px;border-bottom:2px solid var(--ink);padding-bottom:21px}.eyebrow,.decision-label{color:var(--blue);font-size:.68rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;margin:0 0 8px}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(2.15rem,5vw,3.8rem);letter-spacing:-.052em;line-height:.95;margin-bottom:11px}.role{color:var(--muted);font-size:.98rem;margin-bottom:0}.company-summary{max-width:64ch;color:var(--ink);font-size:.88rem;line-height:1.4;margin:10px 0 0}.stamp{color:var(--muted);font-size:.66rem;font-weight:750;letter-spacing:.1em;line-height:1.55;text-align:right;margin:4px 0 0}.section-toc{position:fixed;z-index:4;left:max(18px,calc(50% - 745px));top:50%;transform:translateY(-50%);width:154px;border-left:1px solid var(--line);padding-left:13px;max-height:72vh;overflow:auto}.toc-label{font-size:.63rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin:0 0 7px}.toc-list{padding:0;margin:0;list-style:none}.toc-link{display:flex;gap:7px;color:var(--muted);text-decoration:none;font-size:.7rem;line-height:1.2;padding:5px 0;margin-left:-14px;padding-left:12px;border-left:2px solid transparent}.toc-link:hover,.toc-link:focus-visible,.toc-link[aria-current="true"]{color:var(--ink);border-left-color:var(--blue);outline:0}.toc-number{color:var(--blue);font-size:.61rem;font-weight:800;letter-spacing:.05em}.decision{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:clamp(24px,6vw,74px);margin:clamp(28px,5vw,52px) 0;padding:clamp(22px,4vw,38px);background:var(--blue-wash);border-top:4px solid var(--blue)}.decision-label{color:var(--muted);margin-bottom:8px}.recommendation{font-size:clamp(1.75rem,3.4vw,2.75rem);letter-spacing:-.045em;line-height:.98;margin-bottom:12px}.recommendation.pause{color:var(--red)}.recommendation.continue-after-verification,.recommendation.insufficient-evidence{color:var(--amber)}.decision-why{font-size:1rem;line-height:1.42;max-width:59ch;margin:0}.profile{border-left:1px solid color-mix(in oklch,var(--blue) 25%,var(--line));padding-left:22px;align-self:center}.profile strong{display:block;font-size:.68rem;letter-spacing:.11em;text-transform:uppercase;margin-bottom:9px}.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{font-size:.72rem;font-weight:650;line-height:1;padding:6px 7px;background:var(--paper);border:1px solid color-mix(in oklch,var(--blue) 19%,var(--line))}.overview{border-top:1px solid var(--line);padding-top:24px}.overview-head{display:flex;justify-content:space-between;gap:30px;align-items:end;margin-bottom:19px}.overview h2,.all-research h2{font-size:clamp(1.35rem,2.3vw,1.85rem);letter-spacing:-.035em;line-height:1;margin:0}.status-summary{width:min(440px,100%);align-self:end}.segment-bar{display:flex;height:6px;overflow:hidden;background:var(--grey-wash);margin-bottom:10px}.segment{min-width:0}.segment.positive{background:var(--green)}.segment.verify{background:var(--amber)}.segment.limited{background:var(--grey)}.segment.concern{background:var(--red)}.status-counts{display:flex;flex-wrap:wrap;gap:6px 13px;font-size:.7rem;color:var(--muted)}.status-counts b{color:var(--ink);font-weight:800}.check-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.check-card{min-height:151px;border:1px solid var(--line);background:color-mix(in oklch,var(--paper) 78%,var(--paper-deep));color:var(--ink);text-decoration:none;padding:15px;display:flex;flex-direction:column;justify-content:space-between;transition:background 140ms ease,border-color 140ms ease,transform 140ms ease}.check-card:hover,.check-card:focus-visible{background:var(--paper);border-color:var(--blue);outline:0;transform:translateY(-2px)}.check-card-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.check-title{font-size:.78rem;font-weight:800;letter-spacing:.07em;line-height:1.15;text-transform:uppercase;max-width:18ch}.status{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;font-size:.62rem;font-weight:800;letter-spacing:.08em;line-height:1;text-transform:uppercase;white-space:nowrap}.status:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}.status.positive{color:var(--green)}.status.verify{color:var(--amber)}.status.limited{color:var(--grey)}.status.concern{color:var(--red)}.check-facts{margin:15px 0 0;font-size:.81rem;line-height:1.35}.check-facts p{margin:0}.check-unknown{color:var(--muted);border-top:1px solid color-mix(in oklch,var(--line) 82%,transparent);margin-top:9px!important;padding-top:8px}.questions{margin-top:clamp(42px,6vw,72px);border-top:2px solid var(--ink);padding-top:23px}.questions-head{display:flex;justify-content:space-between;gap:22px;align-items:end;margin-bottom:13px}.questions h2{font-size:clamp(1.38rem,2.5vw,2rem);letter-spacing:-.04em;line-height:1;margin:0}.questions-intro{color:var(--muted);font-size:.84rem;max-width:37ch;margin:0}.action-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.action-item{display:grid;grid-template-columns:42px minmax(130px,.62fr) minmax(0,2fr);gap:13px;align-items:start;border-bottom:1px solid var(--line);padding:16px 0}.action-number{color:var(--blue);font-size:.72rem;font-weight:850;letter-spacing:.08em;padding-top:2px}.action-area{font-size:.72rem;font-weight:800;letter-spacing:.09em;line-height:1.3;text-transform:uppercase;padding-top:2px}.action-question{color:var(--ink);font-size:.93rem;font-weight:620;line-height:1.35;text-decoration:none}.action-question:hover{text-decoration:underline;text-decoration-color:var(--blue);text-underline-offset:3px}.action-why{grid-column:3;margin:0}.action-why summary{color:var(--muted);cursor:pointer;font-size:.76rem;margin-top:6px}.action-why p{font-size:.8rem;line-height:1.4;color:var(--muted);margin:6px 0 0}.all-research{border-top:2px solid var(--ink);border-bottom:1px solid var(--line);margin-top:clamp(44px,7vw,84px)}.research-heading{padding:24px 0}.research-heading p:last-child{color:var(--muted);font-size:.86rem;margin:8px 0 0}.research-body{border-top:1px solid var(--line)}.research-note{font-size:.83rem;color:var(--muted);margin:18px 0 0}.section{scroll-margin-top:72px;border-bottom:1px solid var(--line);padding:clamp(26px,4vw,42px) 0}.section-head{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:13px;align-items:baseline;margin-bottom:12px}.section-index{color:var(--blue);font-size:.72rem;font-weight:850;letter-spacing:.08em}.section h2{font-size:clamp(1.22rem,2vw,1.7rem);letter-spacing:-.035em;line-height:1;margin:0}.section-conclusion{font-size:1rem;line-height:1.42;max-width:75ch;margin:0 0 17px}.section-detail-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(210px,.65fr);gap:clamp(18px,4vw,48px);border-top:1px solid var(--line);padding-top:16px}.detail-label{color:var(--muted);font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 7px}.fact-list{padding:0;margin:0;list-style:none}.fact-list li{font-size:.89rem;line-height:1.4;margin:0 0 9px}.unknown{background:var(--grey-wash);padding:13px}.unknown p:last-child{color:var(--muted);font-size:.84rem;line-height:1.4;margin:0}.section-question{margin-top:17px;border-left:2px solid var(--blue);padding:2px 0 2px 12px;max-width:75ch}.section-question p:last-child{font-size:.9rem;line-height:1.4;margin:0}.finance-snapshot{background:var(--blue-wash);border-left:3px solid var(--blue);padding:15px 17px;margin:18px 0}.finance-snapshot-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:9px}.finance-snapshot h3{font-size:.9rem;letter-spacing:-.02em;margin:0}.finance-type{color:var(--blue);font-size:.63rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap}.finance-plain{font-size:.88rem;line-height:1.43;margin:0}.finance-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:9px;border-top:1px solid color-mix(in oklch,var(--blue) 21%,var(--line));margin:14px 0 0;padding-top:12px}.finance-metric{margin:0}.finance-metric dt{font-size:.63rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.finance-metric dd{font-size:.83rem;font-weight:700;line-height:1.3;margin:4px 0 0}.finance-period{display:block;color:var(--muted);font-size:.68rem;font-weight:500;margin-top:2px}.evidence-drawer{margin-top:20px;border-top:1px dashed var(--line)}.evidence-drawer>summary{cursor:pointer;list-style:none;color:var(--blue);font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;padding:14px 0}.evidence-drawer>summary::-webkit-details-marker{display:none}.evidence-drawer[open]>summary{padding-bottom:9px}.claim{border-top:1px solid color-mix(in oklch,var(--line) 80%,transparent);padding:14px 0}.claim:first-child{border-top:0}.claim p{font-size:.88rem;line-height:1.43;margin:0}.reason{color:var(--muted);margin-top:7px!important}.evidence{border-left:2px solid var(--line);padding-left:13px;margin-top:12px}.evidence h4{font-size:.65rem;letter-spacing:.11em;text-transform:uppercase;margin:0 0 6px}.evidence ul{padding-left:17px;margin:0}.evidence li{font-size:.8rem;line-height:1.4;margin:5px 0}.evidence a{color:var(--blue)}.evidence small,.quiet,footer{font-size:.76rem;line-height:1.4;color:var(--muted)}footer{border-top:1px solid var(--line);padding-top:17px;margin-top:38px;max-width:72ch}@media(max-width:1439px){.section-toc{position:sticky;top:0;left:auto;transform:none;width:auto;max-height:none;overflow-x:auto;overflow-y:hidden;background:color-mix(in oklch,var(--paper) 94%,transparent);backdrop-filter:blur(8px);border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px clamp(16px,4vw,48px);margin:0 calc(clamp(16px,4vw,48px)*-1) 22px}.toc-label{display:inline-block;margin:0 10px 0 0}.toc-list{display:inline-flex;gap:4px;white-space:nowrap}.toc-link{display:inline-flex;margin:0;padding:5px 7px;border-left:0;border-bottom:2px solid transparent}.toc-link:hover,.toc-link:focus-visible,.toc-link[aria-current="true"]{border-color:var(--blue)}.toc-number{display:none}}@media(max-width:740px){.masthead,.overview-head,.questions-head{display:block}.stamp{text-align:left;margin-top:15px}.decision{grid-template-columns:1fr;gap:22px}.profile{border-left:0;border-top:1px solid color-mix(in oklch,var(--blue) 25%,var(--line));padding:16px 0 0}.status-summary{margin-top:18px}.check-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.action-item{grid-template-columns:35px minmax(0,1fr)}.action-question,.action-why{grid-column:2}.action-area{grid-column:2;grid-row:1}.action-number{grid-row:1}.action-question{grid-row:2}.action-why{grid-row:3}.section-detail-grid{grid-template-columns:1fr}.finance-snapshot-head{display:block}.finance-type{display:block;margin-top:6px}}@media(max-width:440px){.check-grid{grid-template-columns:1fr}.check-card{min-height:128px}}@media print{.page{padding:22px}.section-toc{display:none}.all-research{display:block}.all-research:not([open]) .research-body{display:block}.evidence-drawer:not([open])>*:not(summary){display:none}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}`;
}

function tableOfContents(sections: ReportV2Section[]): string {
  if (!sections.length) return "";
  const links = sections.map((section, index) => `<li><a class="toc-link" href="#section-${escapeHtml(section.sectionId)}" data-section-link="${escapeHtml(section.sectionId)}"><span class="toc-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(section.title)}</span></a></li>`).join("");
  return `<nav class="section-toc" aria-label="Research sections"><p class="toc-label">Research</p><ol class="toc-list">${links}</ol></nav>`;
}

function statusSummary(sections: ReportV2Section[]): string {
  const counts: Record<CheckStatus, number> = { positive: 0, verify: 0, limited: 0, concern: 0 };
  sections.forEach((section) => { counts[sectionStatus(section).key] += 1; });
  const segments = (Object.keys(counts) as CheckStatus[]).map((key) => counts[key] ? `<span class="segment ${key}" style="flex:${counts[key]}" aria-hidden="true"></span>` : "").join("");
  const labels: Array<[CheckStatus, string]> = [["positive", "Positive"], ["verify", "Verify"], ["limited", "Limited data"], ["concern", "Concerns"]];
  return `<div class="status-summary" aria-label="${sections.length} company checks: ${counts.positive} positive, ${counts.verify} verify, ${counts.limited} limited data, ${counts.concern} concerns"><div class="segment-bar">${segments}</div><div class="status-counts">${labels.map(([key, label]) => `<span><b>${counts[key]}</b> ${label}</span>`).join("")}</div></div>`;
}

function checkCard(section: ReportV2Section): string {
  const status = sectionStatus(section);
  const fact = oneSentence(sectionSummary(section));
  return `<a class="check-card" href="#section-${escapeHtml(section.sectionId)}" data-section-link="${escapeHtml(section.sectionId)}"><div class="check-card-head"><span class="check-title">${escapeHtml(section.title)}</span><span class="status ${status.key}">${status.label}</span></div><div class="check-facts"><p>${escapeHtml(fact)}</p></div></a>`;
}

function questions(actions: ActionItem[], sections: ReportV2Section[]): string {
  const claimById = new Map(sections.flatMap((section) => section.claims).map((claim) => [claim.claimId, claim]));
  const ordered = [...actions].sort((a, b) => a.priority - b.priority).slice(0, 5);
  if (!ordered.length) return "";
  return `<section class="questions" aria-labelledby="questions-title"><div class="questions-head"><div><p class="eyebrow">Do this next</p><h2 id="questions-title">Questions for the first call</h2></div><p class="questions-intro">Resolve these before spending more time on interviews or an assignment.</p></div><ol class="action-list">${ordered.map((action, index) => actionHtml(action, claimById.get(action.claimId), index + 1)).join("")}</ol></section>`;
}

function actionHtml(action: ActionItem, claim: Claim | undefined, index: number): string {
  const section = claim?.sectionId || "company";
  return `<li class="action-item"><span class="action-number">${String(index).padStart(2, "0")}</span><span class="action-area">${escapeHtml(labelSection(section))}</span><a class="action-question" href="#section-${escapeHtml(section)}" data-section-link="${escapeHtml(section)}">${escapeHtml(action.question)}</a><details class="action-why"><summary>Why this matters</summary><p>${escapeHtml(action.rationale)}</p></details></li>`;
}

function sectionHtml(section: ReportV2Section, sources: Record<string, SourceDocument>, actions: ActionItem[], index: number): string {
  const status = sectionStatus(section);
  const action = actionForSection(section, actions);
  const facts = section.claims.map((claim) => `<li>${escapeHtml(claim.text)}</li>`).join("") || "<li>No source-backed finding was retained for this area.</li>";
  return `<section class="section" id="section-${escapeHtml(section.sectionId)}"><div class="section-head"><span class="section-index">${String(index).padStart(2, "0")}</span><h2>${escapeHtml(section.title)}</h2><span class="status ${status.key}">${status.label}</span></div><p class="section-conclusion">${escapeHtml(sectionSummary(section))}</p>${section.sectionId === "financial_health" ? financeSnapshot(section, sources) : ""}<div class="section-detail-grid"><div><p class="detail-label">Key facts</p><ul class="fact-list">${facts}</ul></div>${status.key === "positive" ? "" : `<aside class="unknown"><p class="detail-label">What remains unknown</p><p>${escapeHtml(unknownFor(section))}</p></aside>`}</div>${action ? `<div class="section-question"><p class="detail-label">Recommended question</p><p>${escapeHtml(action.question)}</p></div>` : ""}${evidenceDrawer(section, sources)}</section>`;
}

function evidenceDrawer(section: ReportV2Section, sources: Record<string, SourceDocument>): string {
  const sourceCount = new Set(section.claims.flatMap((claim) => claim.sourceRefs)).size;
  return `<details class="evidence-drawer"><summary>Evidence &amp; source links · ${sourceCount} source${sourceCount === 1 ? "" : "s"}</summary>${section.claims.map((claim) => claimHtml(claim, sources)).join("") || "<p class=\"quiet\">No source links were retained for this section.</p>"}</details>`;
}

function claimHtml(claim: Claim, sources: Record<string, SourceDocument>): string {
  const refs = claim.sourceRefs.map((id) => sources[id]).filter((source): source is SourceDocument => Boolean(source)).map((source) => `<li><a href="${safeExternalUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a> <small>${escapeHtml(`${source.sourceTier || "unknown"} · ${source.publishedAt?.slice(0, 10) || "date unavailable"}`)}</small></li>`).join("");
  return `<article class="claim"><p>${escapeHtml(claim.text)}</p>${claim.fitReason ? `<p class="reason">Why it matters: ${escapeHtml(claim.fitReason)}</p>` : ""}<div class="evidence"><h4>Sources</h4><p class="quiet">${escapeHtml([claim.scope.role, claim.scope.location, claim.scope.employmentType].filter(Boolean).join(" · ") || "Scope not specified")}</p><ul>${refs || "<li class=\"quiet\">No source link was retained.</li>"}</ul></div></article>`;
}

function financeSnapshot(section: ReportV2Section, sources: Record<string, SourceDocument>): string {
  const profile = section.financeProfile;
  const plain = section.financePlainLanguage?.trim();
  if (!profile && !plain) return "";
  const metrics = profile?.metrics.slice(0, 5).map((metric) => `<dl class="finance-metric"><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}${metric.period ? `<span class="finance-period">${escapeHtml(metric.period)}</span>` : ""}</dd></dl>`).join("") || "";
  const implications = profile?.jobSeekerImplications.length ? `<p class="finance-list-title">What this could mean for you</p><ul class="finance-list">${profile.jobSeekerImplications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  const unknowns = profile?.unknowns.length ? `<p class="finance-list-title">Still unknown</p><ul class="finance-list finance-unknowns">${profile.unknowns.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return `<aside class="finance-snapshot"><div class="finance-snapshot-head"><h3>Finance, in plain language</h3>${profile ? `<span class="finance-type">${escapeHtml(financeCompanyTypeLabel(profile))} · ${escapeHtml(profile.trend)} trend</span>` : ""}</div><p class="finance-plain">${escapeHtml(plain || section.summary)}</p>${metrics ? `<div class="finance-metrics">${metrics}</div>` : ""}${implications}${unknowns}</aside>`;
}

function profileHtml(report: ReportV2): string {
  const profile = report.candidateProfile!;
  const values = [profile.seniority, profile.workAuthorization, profile.workModePreference, ...(profile.priorities || [])].filter(Boolean);
  return `<div class="profile"><strong>Candidate constraints used</strong><div class="chips">${values.map((value) => `<span class="chip">${escapeHtml(String(value).replaceAll("_", " "))}</span>`).join("")}</div></div>`;
}

function sectionStatus(section: ReportV2Section): StatusInfo {
  const statuses = section.claims.map(readingStatus);
  const status = statuses.sort((a, b) => statusRank(b.key) - statusRank(a.key))[0] || { key: "limited", label: "Limited data" as const };
  // A current roster or a lack of a retained adverse result does not establish stability or a clean personal history.
  if (status.key === "positive" && (section.sectionId === "leadership_stability" || section.sectionId === "founder_background")) {
    return { key: "limited", label: "Limited data" };
  }
  return status;
}

function readingStatus(claim: Claim): StatusInfo {
  if (!claim.sourceRefs.length || claim.evidenceState === "insufficient") return { key: "limited", label: "Limited data" };
  if (claim.candidateFit === "mismatch" || claim.impact === "blocking") return { key: "concern", label: "Concern" };
  if (claim.candidateFit === "investigate" || claim.evidenceState === "conflicting" || claim.evidenceState === "limited" || claim.impact === "watch") return { key: "verify", label: "Verify" };
  return { key: "positive", label: "Positive" };
}

function unknownFor(section: ReportV2Section): string {
  const claim = primaryClaim(section);
  if (claim?.fitReason) return claim.fitReason;
  if (claim?.evidenceState === "insufficient") return "The public research did not retain enough evidence to assess this area.";
  return "The available public evidence does not resolve the decision-critical detail for this area.";
}

function primaryClaim(section: ReportV2Section): Claim | undefined {
  return [...section.claims].sort((a, b) => statusRank(readingStatus(b).key) - statusRank(readingStatus(a).key))[0];
}

function actionForSection(section: ReportV2Section, actions: ActionItem[]): ActionItem | undefined {
  const ids = new Set(section.claims.map((claim) => claim.claimId));
  return actions.filter((action) => ids.has(action.claimId)).sort((a, b) => a.priority - b.priority)[0];
}

function sectionSummary(section: ReportV2Section): string {
  const summary = section.summary.replace(/\s+/g, " ").trim();
  return summary || keyFact(primaryClaim(section)?.text || "No public finding was retained for this area.");
}

function decisionWhy(rationale: string): string {
  return rationale.replace(/^Worth a first call:\s*/i, "").replace(/\s+/g, " ").trim();
}

function companySummary(report: ReportV2): string {
  const profile = report.sections.find((section) => section.sectionId === "company_profile_history")?.summary;
  if (!profile) return "";
  const sentences = profile.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) || [profile.trim()];
  return sentences.find((sentence) => /\b(operates|runs|provides|offers|builds|develops|makes|manages)\b/i.test(sentence)) || sentences[0] || "";
}

function recommendationLabel(value: ReportV2["decision"]["recommendation"]): string {
  return { continue: "Strong fit", continue_after_verification: "Worth a first call", pause: "Probably skip", insufficient_evidence: "Verify first" }[value];
}

function financeCompanyTypeLabel(profile: FinanceProfile): string {
  return { public: "Public company", startup: "Startup", private: "Private company", subsidiary: "Subsidiary", unknown: "Company type unclear" }[profile.companyType];
}

function labelSection(value: string): string { return value.replaceAll("_", " "); }
function statusRank(value: CheckStatus): number { return { concern: 4, verify: 3, limited: 2, positive: 1 }[value]; }
function keyFact(text: string): string { const value = text.replace(/\s+/g, " ").trim(); return short(value.match(/^.+?[.!?](?:\s|$)/)?.[0] || value, 170); }
function oneSentence(text: string): string { const value = text.replace(/\s+/g, " ").trim(); return value.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim() || value; }
function short(text: string, length: number): string { const value = text.replace(/\s+/g, " ").trim(); if (value.length <= length) return value; const stop = Math.max(value.lastIndexOf(". ", length), value.lastIndexOf("; ", length), value.lastIndexOf(" — ", length)); return `${value.slice(0, stop > length * .55 ? stop + 1 : length).trim()}…`; }

function navigationScript(): string {
  return `(() => { const links = [...document.querySelectorAll("[data-section-link]")]; const jump = (id) => { requestAnimationFrame(() => document.getElementById("section-" + id)?.scrollIntoView({behavior:"smooth",block:"start"})); }; links.forEach((link) => link.addEventListener("click", (event) => { const id = link.dataset.sectionLink; if (!id) return; event.preventDefault(); history.replaceState(null, "", "#section-" + id); jump(id); })); const tocLinks = [...document.querySelectorAll(".toc-link")]; const setActive = (id) => tocLinks.forEach((link) => link.toggleAttribute("aria-current", link.dataset.sectionLink === id)); const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(visible.target.id.replace("section-", "")); }, {rootMargin:"-25% 0px -62% 0px",threshold:[0,.1,.4]}); document.querySelectorAll(".section[id]").forEach((section) => observer.observe(section)); const initial = location.hash.replace("#section-", ""); if (initial) jump(initial); })();`;
}
