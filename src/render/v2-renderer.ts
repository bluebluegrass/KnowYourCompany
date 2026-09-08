import type { ActionItem, Claim, FinanceProfile, ReportV2, ReportV2Section, SourceDocument } from "../types/index.js";
import { escapeHtml, safeExternalUrl } from "./html-fragments.js";

export function renderReportV2(report: ReportV2): string {
  const orderedSections = [...report.sections]
    .filter((section) => section.claims.length)
    .sort((a, b) => sectionPriority(b) - sectionPriority(a));
  const sections = orderedSections.map((section, index) => sectionHtml(section, report.sources, report.actions, index + 1)).join("");
  const toc = tableOfContents(orderedSections);
  const profile = report.candidateProfile ? profileHtml(report) : "";
  const priorityNote = report.actions.length
    ? `<p class="decision-note">${report.actions.length} decision-critical ${report.actions.length === 1 ? "item" : "items"} appear first below.</p>`
    : "<p class=\"decision-note\">Start with the signals below; detailed public research is available only if you need it.</p>";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.target.company)} — Candidate Brief</title><style>${styles()}${briefStyles()}${summaryStyles()}${tocStyles()}</style></head><body><main class="page"><header class="masthead"><div><p class="kicker">KnowYourCompany · candidate decision brief</p><h1>${escapeHtml(report.target.company)}</h1><p class="role">${escapeHtml([report.target.role, report.target.location].filter(Boolean).join(" · ") || "Company research brief")}</p></div><p class="stamp">PREPARED<br>${escapeHtml(report.generatedAt.slice(0, 10))}<br><br>PUBLIC-SOURCE REVIEW</p></header>${toc}<aside class="decision"><p class="decision-label">Recommendation</p><h2 class="recommendation ${escapeHtml(report.decision.recommendation.replaceAll("_", "-"))}">${escapeHtml(label(report.decision.recommendation))}</h2>${profile}${priorityNote}</aside><article class="report"><section class="intro"><p class="kicker">Bottom line</p><h2>Worth a first call?</h2><p>${escapeHtml(report.decision.rationale)}</p></section>${decisionBrief(orderedSections, report.actions)}<details class="all-research" id="all-research"><summary><div><p class="kicker">Optional evidence</p><h2>All research · ${orderedSections.length} areas</h2><p>Open only if you want to inspect the full public-source record.</p></div><span class="expand">Show full research</span></summary><div class="research-body"><section class="findings"><div class="findings-head"><div><p class="kicker">Research appendix</p><h2>Every signal and source</h2></div><p>Items are ordered by severity. Each source trail stays inside its own section.</p></div>${sections || "<p class=\"quiet\">No evidence claims were available.</p>"}</section></div></details></article><footer>Public-information briefing only. Verify decision-critical details directly with the employer.</footer></main><script>${tocScript()}</script></body></html>`;
}

function styles(): string {
  return `
:root{--paper:oklch(97% .012 86);--paper2:oklch(93% .022 84);--ink:oklch(22% .028 258);--muted:oklch(47% .025 258);--rule:oklch(78% .025 78);--blue:oklch(47% .13 252);--bluePale:oklch(91% .043 252);--red:oklch(48% .16 27);--redPale:oklch(94% .035 27);--amber:oklch(60% .13 72);--amberPale:oklch(95% .035 82);--green:oklch(46% .105 154);--greenPale:oklch(94% .032 154);--grey:oklch(47% .01 258);--greyPale:oklch(93% .008 258);--serif:Georgia,"Times New Roman",serif;--sans:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 var(--sans)}.page{width:min(1180px,100%);margin:auto;padding:clamp(20px,5vw,72px) clamp(16px,4vw,48px) 96px}.masthead{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid var(--ink);padding-bottom:24px;margin-bottom:clamp(32px,6vw,66px)}.kicker,.decision-label{font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--blue);margin:0 0 10px}h1{font:clamp(2.8rem,7vw,5.8rem)/.9 var(--serif);letter-spacing:-.06em;margin:0;max-width:11ch}.role{font-size:1.05rem;color:var(--muted);margin:16px 0 0}.stamp{font-size:.76rem;line-height:1.4;text-align:right;color:var(--muted);margin:0}.decision{background:var(--bluePale);border-top:5px solid var(--blue);padding:22px 24px 24px;margin-bottom:clamp(34px,6vw,66px)}.recommendation{font:clamp(2rem,4vw,3.2rem)/.92 var(--serif);letter-spacing:-.05em;margin:0 0 14px}.recommendation.pause{color:var(--red)}.recommendation.verify-first,.recommendation.continue-after-verification{color:var(--amber)}.profile{border-top:1px solid color-mix(in oklch,var(--blue) 28%,var(--rule));padding-top:15px;margin-top:20px}.profile strong{display:block;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px}.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{display:inline-block;border-radius:999px;padding:6px 8px;font-size:.68rem;font-weight:700;line-height:1;background:var(--paper);color:var(--ink)}.decision-note{border-top:1px solid color-mix(in oklch,var(--blue) 28%,var(--rule));padding-top:14px;margin:20px 0 0;font-size:.88rem;font-weight:650}.intro{max-width:58ch;margin-bottom:32px}.intro h2{font:clamp(1.35rem,2.3vw,1.9rem)/1 var(--serif);letter-spacing:-.035em;margin:0 0 10px}.findings-head h2{font:clamp(1.9rem,3.5vw,3rem)/1 var(--serif);letter-spacing:-.04em;margin:0 0 13px}.intro p:last-child{font-size:1rem;line-height:1.45;margin:0;max-width:58ch}.severity-map{border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-bottom:56px;padding:18px 0 22px}.severity-map-head{display:flex;justify-content:space-between;gap:20px;align-items:baseline;margin-bottom:16px}.severity-map-head h3{font:1.05rem/1.1 var(--serif);margin:0}.severity-map-head p{margin:0;color:var(--muted);font-size:.82rem}.severity-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:8px}.severity-item{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--rule);color:var(--ink);text-decoration:none;padding:10px 11px;font-size:.82rem;font-weight:650}.severity-item:hover{border-color:var(--blue);background:var(--bluePale)}.severity-label{line-height:1.15}.severity-badge,.status{display:inline-block;border-radius:999px;padding:4px 7px;font-size:.64rem;line-height:1;font-weight:800;letter-spacing:.07em;white-space:nowrap}.severity-badge.red,.status.red{background:var(--redPale);color:var(--red)}.severity-badge.yellow,.status.yellow{background:var(--amberPale);color:oklch(38% .095 70)}.severity-badge.green,.status.green{background:var(--greenPale);color:var(--green)}.severity-badge.grey,.status.grey{background:var(--greyPale);color:var(--grey)}.findings-head{display:flex;justify-content:space-between;gap:28px;align-items:end;border-bottom:2px solid var(--ink);padding-bottom:20px}.findings-head h2{margin-bottom:0}.findings-head>p{max-width:30ch;color:var(--muted);font-size:.86rem;line-height:1.4;margin:0}.section{border-bottom:1px solid var(--rule);padding:clamp(26px,4vw,42px) 0}.section-head{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:baseline;margin-bottom:18px}.section-index{color:var(--blue);font-size:.75rem;font-weight:800;letter-spacing:.09em}.section h2{font:clamp(1.4rem,2.7vw,2rem)/1 var(--serif);letter-spacing:-.035em;margin:0}.claim{border-top:1px solid color-mix(in oklch,var(--rule) 85%,transparent)}.claim:last-child{border-bottom:0}.claim summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;cursor:pointer;list-style:none;padding:20px 0}.claim summary::-webkit-details-marker{display:none}.claim summary:focus-visible{outline:3px solid color-mix(in oklch,var(--blue) 42%,transparent);outline-offset:5px}.claim-eyebrow{display:flex;align-items:center;gap:8px;font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}.claim-title{font:clamp(1.1rem,1.8vw,1.36rem)/1.18 var(--serif);letter-spacing:-.02em;margin:0;max-width:50ch}.claim-fact{margin:10px 0 0;max-width:72ch;color:var(--muted);font-size:.9rem;line-height:1.42}.claim-fact b{color:var(--ink);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;margin-right:7px}.next-move{border-left:2px solid var(--blue);padding:2px 0 2px 12px;margin-top:14px;max-width:76ch;font-size:.9rem;line-height:1.42}.next-move b{display:block;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);margin-bottom:2px}.expand{align-self:start;white-space:nowrap;color:var(--blue);font-size:.73rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding-top:4px}.claim[open] .expand{font-size:0}.claim[open] .expand::after{content:"Hide evidence";font-size:.73rem}.claim-body{max-width:75ch;border-top:1px dashed var(--rule);padding:18px 0 6px}.claim-body>p{margin:0 0 12px}.reason{color:var(--muted);font-size:.92rem}.evidence{border-left:2px solid var(--rule);padding-left:14px;margin-top:16px}.evidence h4{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px}.evidence ul{padding-left:18px;margin:0}.evidence li{font-size:.87rem;margin:7px 0}.evidence small,.quiet,footer{color:var(--muted);font-size:.82rem;line-height:1.35}footer{border-top:1px solid var(--rule);margin-top:44px;padding-top:18px;max-width:68ch}@media(max-width:820px){.masthead,.findings-head,.severity-map-head{display:block}.stamp{text-align:left;margin-top:18px}.findings-head>p,.severity-map-head p{margin-top:14px}.claim summary{grid-template-columns:1fr}.expand{padding-top:0}}@media print{.page{padding:24px}.claim:not([open]) .claim-body{display:none}}`;
}

function briefStyles(): string {
  return `.brief{border-top:2px solid var(--ink);margin:0 0 52px}.brief-head{padding:25px 0 22px;border-bottom:1px solid var(--rule)}.brief-head h2{font:clamp(1.7rem,3.1vw,2.7rem)/1 var(--serif);letter-spacing:-.04em;margin:0;max-width:20ch}.brief-group{padding:25px 0;border-bottom:1px solid var(--rule)}.brief-group-head{display:grid;grid-template-columns:minmax(180px,1fr) minmax(260px,2fr);gap:24px;margin-bottom:18px}.brief-group h3{font:clamp(1.18rem,2vw,1.5rem)/1 var(--serif);letter-spacing:-.025em;margin:0}.brief-group-head p{color:var(--muted);font-size:.9rem;line-height:1.38;margin:0;max-width:54ch}.brief-items{display:grid;gap:0}.brief-item{border-top:1px solid color-mix(in oklch,var(--rule) 80%,transparent);padding:15px 0}.brief-item:first-child{border-top:0}.brief-item p{margin:0}.brief-item>p:first-child{font-size:.92rem;line-height:1.25}.brief-detail{font:1.02rem/1.42 var(--serif);letter-spacing:-.012em;max-width:68ch;margin-top:8px!important}.more-signals{font-size:.83rem;color:var(--muted);margin:14px 0 0}.low-risk{border-bottom:0}.low-risk-list{display:flex;flex-wrap:wrap;gap:7px;list-style:none;padding:0;margin:0}.low-risk-list li{background:var(--greenPale);color:var(--green);font-size:.78rem;font-weight:700;padding:6px 8px;border-radius:999px}.data-note{font-size:.83rem;color:var(--muted);margin:15px 0 0}.data-note b{color:var(--ink)}.all-research{border-top:2px solid var(--ink);border-bottom:1px solid var(--rule);margin-top:52px}.all-research>summary{display:flex;justify-content:space-between;gap:24px;align-items:start;cursor:pointer;list-style:none;padding:25px 0}.all-research>summary::-webkit-details-marker{display:none}.all-research>summary h2{font:clamp(1.35rem,2.4vw,1.75rem)/1 var(--serif);letter-spacing:-.03em;margin:0}.all-research>summary p:last-of-type{font-size:.88rem;color:var(--muted);margin:8px 0 0}.all-research[open] .expand{font-size:0}.all-research[open] .expand::after{content:"Hide full research";font-size:.73rem}.research-body{border-top:1px solid var(--rule)}.research-body .findings-head{padding-top:26px}@media(max-width:820px){.brief-group-head{display:block}.brief-group-head p{margin-top:10px}.all-research>summary{display:block}.all-research .expand{display:block;margin-top:14px}}`;
}

function summaryStyles(): string {
  return `.section-summary{font:1.04rem/1.44 var(--serif);letter-spacing:-.012em;max-width:67ch;margin:0 0 20px}.finance-snapshot{max-width:76ch;background:color-mix(in oklch,var(--bluePale) 56%,var(--paper));border-left:4px solid var(--blue);padding:18px 20px;margin:0 0 24px}.finance-snapshot-head{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:10px}.finance-snapshot h3{font:1.18rem/1 var(--serif);letter-spacing:-.02em;margin:0}.finance-type{font-size:.68rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);white-space:nowrap}.finance-plain{font:1rem/1.45 var(--serif);margin:0;max-width:66ch}.finance-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;border-top:1px solid color-mix(in oklch,var(--blue) 24%,var(--rule));margin:16px 0 0;padding-top:14px}.finance-metric{margin:0}.finance-metric dt{font-size:.66rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);line-height:1.25}.finance-metric dd{font-size:.9rem;font-weight:700;line-height:1.3;margin:5px 0 0}.finance-period{display:block;font-size:.72rem;font-weight:500;color:var(--muted);margin-top:3px}.finance-list-title{font-size:.68rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);margin:17px 0 7px}.finance-list{margin:0;padding-left:18px}.finance-list li{font-size:.88rem;line-height:1.4;margin:4px 0}.finance-list.unknowns{color:var(--muted)}.finance-sources{font-size:.78rem;margin:15px 0 0}.finance-sources a{color:var(--blue)}.claim-detail-label{font-size:.92rem;font-weight:650;margin:0}.claim .next-move{margin-top:12px}@media(max-width:820px){.section-summary{font-size:1rem;line-height:1.45}.finance-snapshot{padding:16px}.finance-snapshot-head{display:block}.finance-type{display:block;margin-top:8px}.finance-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
}

function tocStyles(): string {
  return `.section-toc{position:fixed;z-index:5;left:max(18px,calc(50% - 760px));top:50%;transform:translateY(-50%);width:156px;padding:0 0 0 14px;border-left:1px solid var(--rule);max-height:72vh;overflow:auto}.toc-label{color:var(--blue);font-size:.64rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 9px}.toc-list{list-style:none;padding:0;margin:0}.toc-list li{margin:0}.toc-link{display:flex;gap:7px;align-items:baseline;color:var(--muted);text-decoration:none;font-size:.72rem;line-height:1.18;padding:6px 0 6px 1px;border-left:2px solid transparent;margin-left:-15px;padding-left:13px;transition:color 160ms ease,border-color 160ms ease,transform 160ms ease}.toc-link:hover,.toc-link:focus-visible,.toc-link[aria-current="true"]{color:var(--ink);border-left-color:var(--blue);outline:none}.toc-link:hover{transform:translateX(2px)}.toc-number{font-size:.61rem;font-weight:800;letter-spacing:.06em;color:var(--blue);flex:0 0 auto}.toc-title{min-width:0}.toc-link[aria-current="true"] .toc-title{font-weight:800}@media(max-width:1439px){.section-toc{position:sticky;top:0;transform:none;left:auto;width:100%;max-height:none;overflow-x:auto;overflow-y:hidden;background:color-mix(in oklch,var(--paper) 94%,transparent);backdrop-filter:blur(8px);border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);border-left:0;padding:11px clamp(16px,4vw,48px);margin:0 0 24px}.toc-label{display:inline-block;margin:0 12px 0 0}.toc-list{display:inline-flex;gap:4px;vertical-align:middle;white-space:nowrap}.toc-link{display:inline-flex;padding:5px 7px;margin:0;border:0;border-bottom:2px solid transparent}.toc-link:hover,.toc-link:focus-visible,.toc-link[aria-current="true"]{border-bottom-color:var(--blue)}.toc-number{display:none}}@media(max-width:620px){.section-toc{padding:10px 16px;margin-bottom:20px}.toc-label{display:block;margin:0 0 6px}.toc-list{display:flex}.toc-link{font-size:.7rem;padding:5px 6px}}@media print{.section-toc{display:none}}`;
}

function tableOfContents(sections: ReportV2Section[]): string {
  if (!sections.length) return "";
  const links = sections.map((section, index) => `<li><a class="toc-link" href="#section-${escapeHtml(section.sectionId)}" data-section-link="${escapeHtml(section.sectionId)}"><span class="toc-number">${String(index + 1).padStart(2, "0")}</span><span class="toc-title">${escapeHtml(section.title)}</span></a></li>`).join("");
  return `<nav class="section-toc" aria-label="Research sections"><p class="toc-label">Jump to section</p><ol class="toc-list">${links}</ol></nav>`;
}

function tocScript(): string {
  return `(() => { const appendix = document.getElementById("all-research"); const links = [...document.querySelectorAll(".toc-link")]; const jump = (id) => { if (appendix && !appendix.open) appendix.open = true; requestAnimationFrame(() => document.getElementById("section-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" })); }; links.forEach((link) => link.addEventListener("click", (event) => { const id = link.dataset.sectionLink; if (!id) return; event.preventDefault(); history.replaceState(null, "", "#section-" + id); jump(id); })); const setActive = (id) => links.forEach((link) => link.toggleAttribute("aria-current", link.dataset.sectionLink === id)); const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(visible.target.id.replace("section-", "")); }, { rootMargin: "-25% 0px -62% 0px", threshold: [0, .1, .4] }); document.querySelectorAll(".section[id]").forEach((section) => observer.observe(section)); const initial = location.hash.replace("#section-", ""); if (initial) jump(initial); })();`;
}

function decisionBrief(sections: ReportV2Section[], actions: ActionItem[]): string {
  const groups = {
    red: sections.filter((section) => severityForSection(section).className === "red"),
    yellow: sections.filter((section) => severityForSection(section).className === "yellow"),
    green: sections.filter((section) => severityForSection(section).className === "green"),
    grey: sections.filter((section) => severityForSection(section).className === "grey")
  };
  return `<section class="brief"><div class="brief-head"><p class="kicker">3-minute brief</p><h2>What to look out for — and what to ignore for now</h2></div>${briefGroup("red", "Look out for", "Public signals that could materially affect whether you apply.", groups.red, actions)}${briefGroup("yellow", "Confirm during the first call", "Questions to resolve in the recruiter screen before you invest more time.", groups.yellow, actions)}${lowRiskGroup(groups.green, groups.grey)}</section>`;
}

function briefGroup(kind: "red" | "yellow", title: string, description: string, sections: ReportV2Section[], actions: ActionItem[]): string {
  if (!sections.length) return "";
  return `<section class="brief-group ${kind}"><div class="brief-group-head"><h3>${title}</h3><p>${description}</p></div><div class="brief-items">${sections.slice(0, 3).map((section) => briefItem(section, kind, actions)).join("")}</div>${sections.length > 3 ? `<p class="more-signals">+ ${sections.length - 3} more ${kind === "red" ? "concern" : "open question"}${sections.length - 3 === 1 ? "" : "s"} in the appendix.</p>` : ""}</section>`;
}

function briefItem(section: ReportV2Section, kind: "red" | "yellow", actions: ActionItem[]): string {
  const claim = primaryClaim(section);
  const action = actions.find((item) => item.claimId === claim.claimId);
  const detail = kind === "red" ? sectionSummary(section) : checkPrompt(claim, action);
  return `<article class="brief-item"><p><span class="severity-badge ${kind}">${kind === "red" ? "concern found" : "needs confirmation"}</span> <strong>${escapeHtml(section.title)}</strong></p><p class="brief-detail">${escapeHtml(detail)}</p></article>`;
}

function lowRiskGroup(green: ReportV2Section[], grey: ReportV2Section[]): string {
  if (!green.length && !grey.length) return "";
  const greenList = green.map((section) => `<li>${escapeHtml(section.title)}</li>`).join("");
  const greyList = grey.map((section) => `<li>${escapeHtml(section.title)}</li>`).join("");
  return `<section class="brief-group low-risk"><div class="brief-group-head"><h3>Probably safe to deprioritize</h3><p>No major public red flag was found in these areas. This is not a guarantee — just not where to spend your first five minutes.</p></div>${greenList ? `<ul class="low-risk-list green">${greenList}</ul>` : ""}${greyList ? `<div class="data-note"><b>Not enough public data:</b><ul class="low-risk-list grey">${greyList}</ul></div>` : ""}</section>`;
}

function primaryClaim(section: ReportV2Section): Claim {
  const claim = [...section.claims].sort((a, b) => severityRank(readingStatus(b).className) - severityRank(readingStatus(a).className))[0];
  if (!claim) throw new Error(`Cannot render a brief item without a claim: ${section.sectionId}`);
  return claim;
}

function sectionSummary(section: ReportV2Section): string {
  const summary = section.summary.replace(/\s+/g, " ").trim();
  if (summary && summary.length <= 320) return summary;
  return keyFact(primaryClaim(section).text);
}

function checkPrompt(claim: Claim, action?: ActionItem): string {
  if (action) return action.question;
  switch (claim.sectionId) {
    case "layoffs": return "Ask whether this role is new or backfill, and how the team’s headcount changed in the last 12 months.";
    case "financial_health": return "Ask for the latest financial results, whether this team’s hiring plan is fully funded, and what could change that budget.";
    case "leadership_stability": return "Ask what recent leadership changes mean for this team’s priorities and reporting line.";
    case "compensation_benefits": return "Ask for the compensation range and how pay is set for this level and location.";
    case "interview_experience": return "Ask for the current interview stages, decision owner, and expected timeline.";
    case "visa_sponsorship": return "Ask whether this exact role and location support employer sponsorship.";
    case "work_policy": return "Ask what the current in-office expectation is for this team, and whether it may change.";
    default: return "Check the full evidence before deciding how much this signal should affect your application.";
  }
}

function sectionHtml(section: ReportV2Section, sources: Record<string, SourceDocument>, actions: ActionItem[], index: number): string {
  return `<section class="section" id="section-${escapeHtml(section.sectionId)}"><div class="section-head"><span class="section-index">${String(index).padStart(2, "0")}</span><h2>${escapeHtml(section.title)}</h2></div><p class="section-summary">${escapeHtml(sectionSummary(section))}</p>${section.sectionId === "financial_health" ? financeSnapshot(section, sources) : ""}${section.claims.map((claim) => claimHtml(claim, sources, actions.find((action) => action.claimId === claim.claimId))).join("")}</section>`;
}

function financeSnapshot(section: ReportV2Section, sources: Record<string, SourceDocument>): string {
  const profile = section.financeProfile;
  const plainLanguage = section.financePlainLanguage?.trim();
  if (!profile && !plainLanguage) return "";
  const metrics = profile?.metrics.slice(0, 5).map((metric) => `<dl class="finance-metric"><dt>${escapeHtml(metric.label)}</dt><dd>${escapeHtml(metric.value)}${metric.period ? `<span class="finance-period">${escapeHtml(metric.period)}</span>` : ""}</dd></dl>`).join("") || "";
  const implications = profile?.jobSeekerImplications.length
    ? `<p class="finance-list-title">What this could mean for you</p><ul class="finance-list">${profile.jobSeekerImplications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const unknowns = profile?.unknowns.length
    ? `<p class="finance-list-title">Still unknown</p><ul class="finance-list unknowns">${profile.unknowns.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  const refs = profile ? profile.sourceRefs.map((ref) => sources[ref]).filter((source): source is SourceDocument => Boolean(source)).slice(0, 3) : [];
  const sourceLinks = refs.length
    ? `<p class="finance-sources">Financial sources: ${refs.map((source) => `<a href="${safeExternalUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a>`).join(" · ")}</p>`
    : "";
  return `<aside class="finance-snapshot"><div class="finance-snapshot-head"><h3>Finance, in plain language</h3>${profile ? `<span class="finance-type">${escapeHtml(financeCompanyTypeLabel(profile))} · ${escapeHtml(profile.trend)} trend</span>` : ""}</div><p class="finance-plain">${escapeHtml(plainLanguage || section.summary)}</p>${metrics ? `<div class="finance-metrics">${metrics}</div>` : ""}${implications}${unknowns}${sourceLinks}</aside>`;
}

function financeCompanyTypeLabel(profile: FinanceProfile): string {
  return {
    public: "Public company",
    startup: "Startup",
    private: "Private company",
    subsidiary: "Subsidiary",
    unknown: "Company type unclear"
  }[profile.companyType];
}

function claimHtml(claim: Claim, sources: Record<string, SourceDocument>, action?: ActionItem): string {
  const refs = claim.sourceRefs
    .map((id) => sources[id])
    .filter((source): source is SourceDocument => Boolean(source))
    .map((source) => `<li><a href="${safeExternalUrl(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a> <small>${escapeHtml(`${source.sourceTier || "unknown"} · ${source.publishedAt?.slice(0, 10) || "date unavailable"}`)}</small></li>`)
    .join("");
  const status = readingStatus(claim);
  const nextMove = action
    ? `<div class="next-move"><b>Next move · ask ${escapeHtml(action.owner.replaceAll("_", " "))}</b>${escapeHtml(action.question)}</div>`
    : "";
  return `<details class="claim" data-fit="${escapeHtml(claim.candidateFit)}"><summary><div><p class="claim-eyebrow">${escapeHtml(labelSection(claim.sectionId))} <span class="status ${status.className}">${escapeHtml(status.label)}</span></p><p class="claim-detail-label">Detailed findings and source trail</p>${nextMove}</div><span class="expand">View evidence</span></summary><div class="claim-body"><p>${escapeHtml(claim.text)}</p>${claim.fitReason ? `<p class="reason">Why it matters: ${escapeHtml(claim.fitReason)}</p>` : ""}<div class="evidence"><h4>Full research & sources</h4><p class="quiet">${escapeHtml([claim.scope.role, claim.scope.location, claim.scope.employmentType].filter(Boolean).join(" · ") || "Scope not specified")}</p><ul>${refs || "<li class=\"quiet\">No source link was retained.</li>"}</ul></div></div></details>`;
}

function profileHtml(report: ReportV2): string {
  const profile = report.candidateProfile!;
  const values = [profile.seniority, profile.workAuthorization, profile.workModePreference, ...(profile.priorities || [])].filter(Boolean);
  return `<div class="profile"><strong>Candidate constraints used</strong><div class="chips">${values.map((value) => `<span class="chip">${escapeHtml(String(value).replaceAll("_", " "))}</span>`).join("")}</div></div>`;
}

function readingStatus(claim: Claim): { label: string; className: "red" | "yellow" | "green" | "grey" } {
  if (claim.sourceRefs.length === 0 || claim.evidenceState === "insufficient") return { label: "no data", className: "grey" };
  if (claim.candidateFit === "mismatch" || claim.impact === "blocking" || claim.impact === "material") return { label: "concern found", className: "red" };
  if (claim.candidateFit === "investigate" || claim.evidenceState === "conflicting" || claim.impact === "watch") return { label: "mixed signals", className: "yellow" };
  return { label: "no concerns", className: "green" };
}

function readingConclusion(claim: Claim): string {
  if (claim.fitReason) return claim.fitReason;
  if (claim.evidenceState === "conflicting") return "The public evidence conflicts; confirm the role-specific answer before relying on it.";
  return keyFact(claim.text);
}

function severityForSection(section: ReportV2Section): { label: string; className: "red" | "yellow" | "green" | "grey" } {
  return section.claims.map(readingStatus).sort((a, b) => severityRank(b.className) - severityRank(a.className))[0] || { label: "no data", className: "grey" };
}

function severityRank(value: "red" | "yellow" | "green" | "grey"): number {
  return { red: 4, yellow: 3, grey: 2, green: 1 }[value];
}

function keyFact(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.match(/^.+?[.!?](?:\s|$)/)?.[0] || normalized;
  return short(firstSentence, 160);
}

function sectionPriority(section: ReportV2Section): number {
  return severityRank(severityForSection(section).className);
}

function label(value: ReportV2["decision"]["recommendation"]): string {
  return { continue: "Continue", continue_after_verification: "Verify first", pause: "Pause", insufficient_evidence: "Need more evidence" }[value];
}

function labelSection(value: Claim["sectionId"]): string {
  return value.replaceAll("_", " ");
}

function short(text: string, length: number): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= length) return value;
  const stop = Math.max(value.lastIndexOf(". ", length), value.lastIndexOf("; ", length), value.lastIndexOf(" — ", length));
  return `${value.slice(0, stop > length * .55 ? stop + 1 : length).trim()}…`;
}
