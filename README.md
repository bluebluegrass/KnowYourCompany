# KnowYourCompany

**Stop wasting interviews on companies that are quietly falling apart.**

KnowYourCompany is a Claude Code skill that researches a company and generates a structured, offline HTML report — in about 2 minutes — so you know what you're walking into before you spend weeks in a hiring process.

---

## Why this exists

Job searches are exhausting. You apply, you prep, you interview — and then you find out the company had layoffs last month, is drowning in lawsuits, or has a culture that burns people out in six months.

This tool is built for candidates who want **signal before they commit their time**.

---

## What it is NOT

- Not a stock screener or investment tool
- Not for financial modeling or valuation
- Not a substitute for legal or financial advice

This is built for one thing: **helping you decide where to spend your time**.

---

## What it covers

Each report analyzes 12 areas, automatically ranked by severity:

| Area | What it looks for |
|---|---|
| Layoffs | Recent cuts, headcount reductions, affected teams |
| Financial health | Funding rounds, runway signals, revenue trajectory |
| Leadership | C-suite turnover, founder involvement, recent exits |
| Legal & regulatory | Lawsuits, class actions, regulatory enforcement |
| Culture | Glassdoor, Blind, Reddit — recurring themes |
| Remote / hybrid policy | Official policy and recent RTO changes |
| Compensation | Salary ranges, equity type, benefits signals |
| Interview experience | Number of rounds, ghosting reports, offer rescissions |
| Visa sponsorship | Country-specific sponsorship programs and status |
| Product & market health | Ratings, growth signals, major incidents |
| Company history | Founding, milestones, business model, headcount |
| Founder background | Prior companies, notable achievements, controversies |

---

## What you get

A single HTML file that opens in any browser — no login, no internet required after download.

- Severity map at the top so the biggest concerns are immediately visible
- Red / yellow / green / grey badges per section
- Collapsible sections with cited sources
- Dark mode
- Sections auto-sorted so red flags appear first

![KnowYourCompany report sample](sample.png)

---

## How to use it

### Requirements

- [Claude Code](https://claude.ai/code)
- Claude Code authenticated via `claude auth login`

No `ANTHROPIC_API_KEY` is required for the local runtime path in this repo.

### Setup

1. Copy this folder into `~/.claude/commands/`
2. Open Claude Code
3. Type `/KnowYourCompany`

Claude will ask for the company name, office location (optional), and your target role (optional), then run the research and produce the report.

---

## How HTML rendering reduces token usage

In the [original skill](https://github.com/bluebluegrass/KnowYourCompany), Claude writes the final HTML file directly — reading `template.html`, inlining the CSS, and filling every placeholder itself. That means the full HTML template and all its content pass through the model context on every run.

This repo separates that step:

1. **Claude writes a `.report.json`** — a flat JSON object with one key per template placeholder. The values are the researched content (prose, badge colours, source links). This is compact and structured.
2. **A script renders the HTML** — `references/render.js` reads the JSON and `template.html`, substitutes every `{{ PLACEHOLDER }}`, inlines the CSS, and writes the `.html` file. No model call. No tokens.

| Step | Original skill | This repo |
|---|---|---|
| Research + analysis | Claude | Claude (unchanged) |
| Write findings | Claude fills HTML template | Claude writes `.report.json` |
| HTML rendering | Claude (reads template, writes file) | `node references/render.js` — zero tokens |
| Re-render after design change | Full re-run | Re-run script only — zero tokens |

The research and judgment are still entirely Claude's work. The only thing removed from the model's responsibility is mechanical string substitution into a template.

---

## Repo structure
```text
KnowYourCompany/
├── KnowYourCompany.md        — the skill (copy this folder to ~/.claude/commands/)
├── README.md
├── references/
│   ├── template.html         — HTML skeleton with {{ PLACEHOLDER }} slots
│   ├── styles.css            — visual source of truth (inlined at render time)
│   └── render.js             — script: reads .report.json → writes .html (no AI)
└── examples/
    ├──  Sardine_KnowYourCompany_2026-04-16.html           - Built with V0, everything done by AI.
    ├── Darktrace_KnowYourCompany_2026-04-17.report.json   - Built with V1, AI produces the report.
    └── Darktrace_KnowYourCompany_2026-04-17.html          - Built with V1, html built with script, no AI. saves 50% of tokens.
    

```
