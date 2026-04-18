# KnowYourCompany

**Stop wasting interviews on companies that are quietly falling apart.**

KnowYourCompany is a prompt bundle for **Claude Code** and **Codex** that researches a company and generates a structured offline HTML report so you know what you're walking into before you spend weeks in a hiring process.

---

## Why this exists

Job searches are exhausting. You apply, you prep, you interview — and then you find out the company had layoffs last month, is drowning in lawsuits, or has a culture that burns people out in six months.

This tool is built for candidates who want **signal before they commit their time**.

---

## What it is not

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

## How it works

This repo is designed as a **prompt bundle that generates `.report.json`**, plus a small script that turns that JSON into HTML.

1. The AI researches the company and writes a `.report.json`
2. `references/render.js` reads that JSON and renders a self-contained `.html`

The AI does the research and judgment. The script only does deterministic HTML rendering.

---

## Use with Claude Code

Claude Code uses the mirror skill at [`.claude/skills/know-your-company/SKILL.md`](./.claude/skills/know-your-company/SKILL.md).

### Requirements

- [Claude Code](https://claude.ai/code)
- `claude auth login`
- Node.js installed, so `node references/render.js ...` can run

### Usage

Open Claude Code in this repo and ask it to use the `know-your-company` skill to research a company and generate a report.

Example:

```text
Use the know-your-company skill to research Darktrace for a Data Engineer role in Amsterdam, write the report in English, generate the .report.json in the current directory, then render the HTML.
```

---

## Use with Codex

Codex **does** automatically load [AGENTS.md](/Users/simona/Documents/Vibe Projects/bg_check/AGENTS.md:1) when run from this repo.

### Requirements

- [Codex CLI](https://developers.openai.com/codex/cli)
- `codex login`
- Node.js installed, so `node references/render.js ...` can run

### Install

No extra install step is required beyond cloning the repo.

```bash
git clone https://github.com/bluebluegrass/KnowYourCompany
cd KnowYourCompany
codex
```

Or non-interactively:

```bash
codex --search exec --ephemeral --skip-git-repo-check --sandbox workspace-write "Research Darktrace for a Data Engineer role in Amsterdam, write the report in English, generate the KnowYourCompany report JSON in the current directory, then render the HTML."
```

### Important difference

- **Codex** auto-loads `AGENTS.md` from the repo
- **Claude Code** uses the mirror skill in `.claude/skills/know-your-company/`

---

## Why JSON first

In the [original skill](https://github.com/bluebluegrass/KnowYourCompany), the model writes the final HTML directly — reading `template.html`, inlining the CSS, and filling every placeholder itself. That means the full template flows through model context every run.

This repo separates that step:

1. The model writes a compact `.report.json`
2. A local script renders the HTML with zero extra model tokens

| Step | Original skill | This repo |
|---|---|---|
| Research + analysis | Claude / Codex | Claude / Codex |
| Write findings | Model fills HTML directly | Model writes `.report.json` |
| HTML rendering | Model writes file | `node references/render.js` |
| Re-render after design change | Full rerun | Re-run script only |

---

## Repo structure

```text
KnowYourCompany/
├── README.md
├── AGENTS.md                 — Codex repo instructions
├── .agents/
│   └── skills/
│       └── know-your-company/
│           └── SKILL.md      — canonical Codex skill
├── .claude/
│   └── skills/
│       └── know-your-company/
│           └── SKILL.md      — Claude Code mirror skill
├── references/
│   ├── render.js             — .report.json -> .html
│   ├── template.html         — HTML skeleton with {{ PLACEHOLDER }} slots
│   └── styles.css            — inlined at render time
├── examples/                 — sample rendered reports
├── sample.png                — screenshot used in the README
├── PRD.md                    — product and workflow notes
└── docs/                     — optional repo notes
    ...

Generated in the repo root:
- `*.report.json` — structured report data
- `*.html` — rendered report artifacts
```
