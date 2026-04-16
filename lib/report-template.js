const SEVERITY_ORDER = {
  red: 0,
  yellow: 1,
  green: 2,
  grey: 3,
};

const SEVERITY_LABELS = {
  red: "Concern found",
  yellow: "Mixed signals",
  green: "No concerns",
  grey: "No data",
};

const SECTION_DEFS = [
  ["layoffs", "Layoffs"],
  ["financial_health", "Financial Health"],
  ["leadership_stability", "Leadership"],
  ["legal_regulatory", "Legal"],
  ["company_culture", "Culture"],
  ["work_policy", "RTO Policy"],
  ["compensation_benefits", "Compensation"],
  ["interview_experience", "Interview"],
  ["visa_sponsorship", "Visa Sponsorship"],
  ["product_market_health", "Product Health"],
  ["company_profile_history", "Company Profile"],
  ["founder_background", "Founder"],
];

const REPORT_STYLE = `
:root {
  --bg: #f3efe6;
  --bg-accent: #e6ddce;
  --surface: rgba(255, 251, 245, 0.9);
  --surface-strong: #fffdf8;
  --surface-muted: rgba(248, 242, 231, 0.82);
  --border: rgba(87, 70, 50, 0.16);
  --border-strong: rgba(87, 70, 50, 0.28);
  --text: #221d18;
  --muted: #6f655a;
  --accent: #7d2f24;
  --accent-soft: #ead7cb;
  --shadow: 0 22px 60px rgba(57, 41, 27, 0.12);
  --green: #1d6a43;
  --green-bg: rgba(29, 106, 67, 0.1);
  --green-border: rgba(29, 106, 67, 0.25);
  --yellow: #9a6a00;
  --yellow-bg: rgba(154, 106, 0, 0.12);
  --yellow-border: rgba(154, 106, 0, 0.28);
  --red: #a13324;
  --red-bg: rgba(161, 51, 36, 0.11);
  --red-border: rgba(161, 51, 36, 0.3);
  --grey: #6b6762;
  --grey-bg: rgba(107, 103, 98, 0.12);
  --grey-border: rgba(107, 103, 98, 0.24);
}

[data-theme="dark"] {
  --bg: #161311;
  --bg-accent: #201b18;
  --surface: rgba(35, 29, 25, 0.9);
  --surface-strong: #2b241f;
  --surface-muted: rgba(45, 37, 32, 0.84);
  --border: rgba(225, 210, 192, 0.12);
  --border-strong: rgba(225, 210, 192, 0.22);
  --text: #f3ece3;
  --muted: #b7ab9f;
  --accent: #d58b72;
  --accent-soft: rgba(213, 139, 114, 0.18);
  --shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
  --green: #72d7a1;
  --green-bg: rgba(114, 215, 161, 0.13);
  --green-border: rgba(114, 215, 161, 0.28);
  --yellow: #efbe55;
  --yellow-bg: rgba(239, 190, 85, 0.14);
  --yellow-border: rgba(239, 190, 85, 0.28);
  --red: #f08d79;
  --red-bg: rgba(240, 141, 121, 0.14);
  --red-border: rgba(240, 141, 121, 0.3);
  --grey: #beb5ae;
  --grey-bg: rgba(190, 181, 174, 0.12);
  --grey-border: rgba(190, 181, 174, 0.2);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(125, 47, 36, 0.08), transparent 28rem),
    radial-gradient(circle at top right, rgba(154, 106, 0, 0.08), transparent 22rem),
    linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 82%, var(--bg-accent)) 100%);
  color: var(--text);
  line-height: 1.65;
  min-height: 100vh;
}
a {
  color: var(--accent);
  text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
  text-underline-offset: 0.18em;
}
a:hover { text-decoration-color: currentColor; }
.container {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: clamp(1.2rem, 2vw, 2rem) 0 4rem;
}
.header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: clamp(1.25rem, 2vw, 1.75rem);
  margin-bottom: 1.5rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--surface-strong) 76%, var(--accent-soft)) 0%, var(--surface) 100%);
  border: 1px solid var(--border-strong);
  border-radius: 28px;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}
.header::after {
  content: "";
  position: absolute;
  inset: auto -8% -45% auto;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 68%);
  pointer-events: none;
}
.header-copy { position: relative; z-index: 1; max-width: 52rem; }
.eyebrow {
  margin-bottom: 0.8rem;
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.header-title h1 {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: clamp(2.3rem, 5vw, 4.8rem);
  line-height: 0.95;
  font-weight: 700;
  letter-spacing: -0.04em;
  max-width: 10ch;
}
.header-dek {
  margin-top: 0.9rem;
  max-width: 44rem;
  color: color-mix(in srgb, var(--text) 82%, var(--muted));
  font-size: clamp(1rem, 1.8vw, 1.1rem);
}
.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.48rem 0.72rem;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.78rem;
}
.meta-chip strong { color: var(--text); font-weight: 700; }
.header-lede {
  margin-top: 1rem;
  max-width: 40rem;
  color: var(--muted);
  font-size: 0.94rem;
}
.theme-btn {
  appearance: none;
  border: 1px solid var(--border-strong);
  background: color-mix(in srgb, var(--surface-strong) 88%, transparent);
  color: var(--text);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.summary-shell { margin-bottom: 1.5rem; }
.summary-intro {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.summary-intro h2,
.verdict-label {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
}
.summary-intro h2 {
  font-size: clamp(1.25rem, 2.2vw, 1.7rem);
  letter-spacing: -0.03em;
}
.summary-intro p {
  max-width: 36rem;
  color: var(--muted);
  font-size: 0.88rem;
}
.verdict {
  margin-bottom: 1.5rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border);
  border-radius: 26px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 78%, transparent), var(--surface));
  box-shadow: 0 18px 44px rgba(57, 41, 27, 0.08);
}
.verdict-label {
  font-size: 1.1rem;
  letter-spacing: -0.03em;
}
.verdict-text {
  margin-top: 0.6rem;
  max-width: 54rem;
  font-size: 1rem;
}
.verdict-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}
.verdict-flag,
.section-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.flag-red, .badge-red-pill { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
.flag-yellow, .badge-yellow-pill { background: var(--yellow-bg); color: var(--yellow); border: 1px solid var(--yellow-border); }
.flag-green, .badge-green-pill { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
.flag-grey, .badge-grey-pill { background: var(--grey-bg); color: var(--grey); border: 1px solid var(--grey-border); }
.summary {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.8rem;
}
.summary-item {
  grid-column: span 3;
  min-height: 7.25rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 78%, transparent), var(--surface));
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 1.2rem 1rem 0.95rem;
  box-shadow: 0 10px 24px rgba(57, 41, 27, 0.06);
  position: relative;
  overflow: hidden;
}
.summary-item::before {
  content: "";
  position: absolute;
  inset: 0.55rem 0.85rem auto;
  height: 5px;
  border-radius: 999px;
  background: var(--border-strong);
}
.summary-item.red::before { background: linear-gradient(90deg, var(--red), color-mix(in srgb, var(--red) 45%, transparent)); }
.summary-item.yellow::before { background: linear-gradient(90deg, var(--yellow), color-mix(in srgb, var(--yellow) 45%, transparent)); }
.summary-item.green::before { background: linear-gradient(90deg, var(--green), color-mix(in srgb, var(--green) 45%, transparent)); }
.summary-item.grey::before { background: linear-gradient(90deg, var(--grey), color-mix(in srgb, var(--grey) 45%, transparent)); }
.summary-item .label {
  max-width: 10ch;
  color: var(--muted);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.summary-item .badge {
  display: inline-block;
  margin-top: 1rem;
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.1;
}
.badge-red { color: var(--red); }
.badge-yellow { color: var(--yellow); }
.badge-green { color: var(--green); }
.badge-grey { color: var(--grey); }
.section {
  margin-bottom: 1rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 74%, transparent), var(--surface));
  border: 1px solid var(--border);
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(57, 41, 27, 0.08);
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.35rem;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-muted) 72%, transparent), transparent);
}
.section-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.section-title span:first-child {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  font-size: clamp(1.15rem, 1.8vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.chevron {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.8rem;
  transition: transform 0.22s ease;
}
.chevron.open { transform: rotate(180deg); }
.section-body {
  padding: 0 1.35rem 1.35rem;
  border-top: 1px solid var(--border);
}
.section-body.hidden { display: none; }
.section-body h3 {
  margin: 1.2rem 0 0.55rem;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.section-body p,
.section-body li { font-size: 0.98rem; }
.section-body p { margin-bottom: 0.75rem; }
.section-body ul { padding-left: 1.15rem; }
.section-body ul li + li { margin-top: 0.45rem; }
.plain-english {
  margin: 1rem 0;
  padding: 1rem 1.05rem;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 78%, var(--surface-strong)), color-mix(in srgb, var(--surface-strong) 80%, transparent));
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-radius: 20px;
  color: color-mix(in srgb, var(--text) 88%, var(--accent));
}
.plain-english strong,
.sources p,
.disclaimer-label {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.disclaimer {
  margin: 1rem 0;
  padding: 0.9rem 1rem;
  border: 1px solid var(--yellow-border);
  border-radius: 18px;
  background: var(--yellow-bg);
  color: color-mix(in srgb, var(--yellow) 78%, var(--text));
  font-size: 0.86rem;
}
.sources {
  margin-top: 1rem;
  padding-top: 0.95rem;
  border-top: 1px dashed var(--border-strong);
}
.sources ul { padding-left: 1rem; }
.sources li { font-size: 0.86rem; }
.footer {
  margin-top: 2rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: linear-gradient(180deg, var(--surface), var(--surface-muted));
  color: var(--muted);
  font-size: 0.83rem;
  line-height: 1.75;
  box-shadow: 0 16px 36px rgba(57, 41, 27, 0.08);
}
@media (max-width: 900px) {
  .summary-item { grid-column: span 4; }
}
@media (max-width: 680px) {
  .container { width: min(100% - 1rem, 100%); }
  .header { grid-template-columns: 1fr; border-radius: 22px; }
  .header-title h1 { max-width: none; }
  .summary-intro { flex-direction: column; align-items: start; }
  .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { grid-column: span 1; min-height: 6.5rem; }
  .section-header, .section-body, .footer { padding-left: 1rem; padding-right: 1rem; }
}
`;

export function getSectionDefinitions() {
  return SECTION_DEFS.map(([id, shortTitle], index) => ({
    id,
    shortTitle,
    order: index + 1,
  }));
}

export function normalizeReport(report, inputs) {
  const sectionsById = new Map((report.sections || []).map((section) => [section.id, section]));
  const sections = getSectionDefinitions()
    .map((definition) => {
      const source = sectionsById.get(definition.id) || {};
      const severity = normalizeSeverity(source.severity);
      return {
        ...definition,
        title: source.title || defaultLongTitle(definition.id, definition.order),
        severity,
        label: SEVERITY_LABELS[severity],
        summary: source.summary || "No data found for this section.",
        bullets: normalizeStringArray(source.bullets),
        plainEnglish: typeof source.plain_english === "string" ? source.plain_english.trim() : "",
        disclaimers: normalizeStringArray(source.disclaimers),
        sources: normalizeSources(source.sources),
      };
    })
    .sort((a, b) => {
      const severityDelta = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      return severityDelta !== 0 ? severityDelta : a.order - b.order;
    });

  return {
    company: report.company || inputs.company,
    reportLanguage: report.report_language || inputs.outputLanguage || "English",
    generatedAt: report.generated_at || new Date().toISOString().slice(0, 10),
    location: inputs.location || "",
    role: inputs.role || "",
    bottomLine: report.bottom_line || "No bottom-line summary was returned.",
    notableFlags: normalizeFlags(report.notable_flags),
    sections,
  };
}

export function renderFullReportHtml(report) {
  const safeTitle = escapeHtml(report.company);
  const metaChips = [
    `<span class="meta-chip"><strong>Generated</strong> ${escapeHtml(report.generatedAt)}</span>`,
    report.location ? `<span class="meta-chip"><strong>Office</strong> ${escapeHtml(report.location)}</span>` : "",
    report.role ? `<span class="meta-chip"><strong>Role</strong> ${escapeHtml(report.role)}</span>` : "",
    `<span class="meta-chip"><strong>Language</strong> ${escapeHtml(report.reportLanguage)}</span>`,
  ].filter(Boolean).join("");

  const summaryCards = report.sections.map((section) => `
    <div class="summary-item ${section.severity}">
      <div class="label">${escapeHtml(section.shortTitle)}</div>
      <div class="badge badge-${section.severity}">${escapeHtml(section.label)}</div>
    </div>
  `).join("");

  const sectionMarkup = report.sections.map((section) => {
    const bulletMarkup = section.bullets.length
      ? `<h3>Key Findings</h3><ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
      : "";
    const sourceMarkup = section.sources.length
      ? `<div class="sources"><p>Sources</p><ul>${section.sources.map((source) => `<li><a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a></li>`).join("")}</ul></div>`
      : `<div class="sources"><p>Sources</p><ul><li>No verifiable source links returned for this section.</li></ul></div>`;
    const disclaimerMarkup = section.disclaimers.map((text) => `
      <div class="disclaimer">
        <span class="disclaimer-label">Disclaimer</span>
        ${escapeHtml(text)}
      </div>
    `).join("");
    const plainEnglish = section.plainEnglish
      ? `<div class="plain-english"><strong>Plain English</strong>${escapeHtml(section.plainEnglish)}</div>`
      : "";

    return `
      <div class="section">
        <div class="section-header" onclick="toggleSection(this)">
          <div class="section-title">
            <span>${section.order}. ${escapeHtml(section.title)}</span>
            <span class="section-badge badge-${section.severity}-pill">${escapeHtml(section.label)}</span>
          </div>
          <span class="chevron ${section.severity === "red" ? "open" : ""}">▼</span>
        </div>
        <div class="section-body ${section.severity === "red" ? "" : "hidden"}">
          <p>${escapeHtml(section.summary)}</p>
          ${bulletMarkup}
          ${plainEnglish}
          ${disclaimerMarkup}
          ${sourceMarkup}
        </div>
      </div>
    `;
  }).join("");

  const verdictFlags = report.notableFlags.map((flag) => `
    <span class="verdict-flag flag-${normalizeSeverity(flag.tone)}">${escapeHtml(flag.text)}</span>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — KnowYourCompany Report</title>
  <style>${REPORT_STYLE}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-copy">
        <p class="eyebrow">KnowYourCompany</p>
        <div class="header-title"><h1>${safeTitle}</h1></div>
        <p class="header-dek">A public-signal briefing across operations, leadership, legal exposure, compensation, and market health.</p>
        <div class="header-meta">${metaChips}</div>
        <p class="header-lede">Use the severity map to jump straight to the highest-risk areas. Red items surface material concerns first, followed by mixed signals and lower-risk findings.</p>
      </div>
      <div class="header-actions">
        <button class="theme-btn" onclick="toggleTheme()">Toggle Dark Mode</button>
      </div>
    </div>

    <div class="verdict">
      <p class="verdict-label">Bottom Line</p>
      <p class="verdict-text">${escapeHtml(report.bottomLine)}</p>
      <div class="verdict-flags">${verdictFlags}</div>
    </div>

    <div class="summary-shell">
      <div class="summary-intro">
        <h2>Severity Map</h2>
        <p>The report is ordered by severity so the biggest concerns show up first.</p>
      </div>
      <div class="summary">${summaryCards}</div>
    </div>

    ${sectionMarkup}

    <div class="footer">
      This briefing uses public web sources returned through the OpenAI Responses API web search tool. Community-sourced sections should be treated as directional signal rather than verified fact, and the legal content here is informational only, not legal advice.
    </div>
  </div>
  <script>
    function toggleSection(header) {
      const body = header.nextElementSibling;
      const chevron = header.querySelector(".chevron");
      body.classList.toggle("hidden");
      chevron.classList.toggle("open");
    }
    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", current === "dark" ? "light" : "dark");
    }
  </script>
</body>
</html>`;
}

export function makeDownloadFilename(company) {
  return `${company.trim().replace(/\s+/g, "_")}_KnowYourCompany_${new Date().toISOString().slice(0, 10)}.html`;
}

export function createResearchPrompt(inputs) {
  return [
    "You are generating a company diligence report for a job candidate.",
    "Use web search to gather current public information and output only the requested JSON schema.",
    "Every section must use only verifiable public information. If evidence is weak or missing, say so clearly and mark the section grey or yellow.",
    "Culture, compensation, and interview sections must include a disclaimer that community reports are self-reported and unverified.",
    "The legal section must include a disclaimer that the report is informational only and not legal advice.",
    "The financial health section must include a plain-English explanation.",
    "Prefer direct company, regulator, investor, court, and reputable publication sources over aggregators.",
    `Company: ${inputs.company}`,
    `Office location: ${inputs.location || "Not provided"}`,
    `Target role: ${inputs.role || "Not provided"}`,
    `Output language: ${inputs.outputLanguage || "English"}`,
    "Required sections by id:",
    SECTION_DEFS.map(([id, shortTitle], index) => `${index + 1}. ${id} (${shortTitle})`).join("\n"),
  ].join("\n");
}

export function getResponseJsonSchema() {
  return {
    name: "company_research_report",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["company", "report_language", "generated_at", "bottom_line", "notable_flags", "sections"],
      properties: {
        company: { type: "string" },
        report_language: { type: "string" },
        generated_at: { type: "string" },
        bottom_line: { type: "string" },
        notable_flags: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tone", "text"],
            properties: {
              tone: { type: "string", enum: ["red", "yellow", "green", "grey"] },
              text: { type: "string" },
            },
          },
        },
        sections: {
          type: "array",
          minItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "title", "severity", "summary", "bullets", "plain_english", "disclaimers", "sources"],
            properties: {
              id: { type: "string", enum: SECTION_DEFS.map(([id]) => id) },
              title: { type: "string" },
              severity: { type: "string", enum: ["red", "yellow", "green", "grey"] },
              summary: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              plain_english: { type: "string" },
              disclaimers: { type: "array", items: { type: "string" } },
              sources: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "url"],
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    strict: true,
  };
}

function normalizeSeverity(value) {
  return Object.prototype.hasOwnProperty.call(SEVERITY_LABELS, value) ? value : "grey";
}

function normalizeStringArray(values) {
  return Array.isArray(values)
    ? values.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean)
    : [];
}

function normalizeSources(sources) {
  return Array.isArray(sources)
    ? sources
        .map((source) => ({
          title: typeof source?.title === "string" ? source.title.trim() : "",
          url: typeof source?.url === "string" ? source.url.trim() : "",
        }))
        .filter((source) => source.title && source.url)
    : [];
}

function normalizeFlags(flags) {
  const safeFlags = Array.isArray(flags) ? flags : [];
  return safeFlags
    .map((flag) => ({
      tone: normalizeSeverity(flag?.tone),
      text: typeof flag?.text === "string" ? flag.text.trim() : "",
    }))
    .filter((flag) => flag.text)
    .slice(0, 6);
}

function defaultLongTitle(id, order) {
  const labelMap = {
    layoffs: "Recent Layoffs",
    financial_health: "Financial Health",
    leadership_stability: "Leadership Stability",
    legal_regulatory: "Legal & Regulatory",
    company_culture: "Company Culture",
    work_policy: "Remote / Hybrid / RTO Policy",
    compensation_benefits: "Compensation & Benefits",
    interview_experience: "Interview Experience",
    visa_sponsorship: "Visa & Immigration Sponsorship",
    product_market_health: "Product & Market Health",
    company_profile_history: "Company Profile & History",
    founder_background: "Founder Background",
  };
  return labelMap[id] || `Section ${order}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
