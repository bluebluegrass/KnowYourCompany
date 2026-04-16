# KnowYourCompany

**Stop wasting interviews on companies that are quietly falling apart.**

KnowYourCompany is a Claude Code skill that researches a company and generates a structured, offline HTML report — in about 2 minutes — so you know what you're walking into before you spend weeks in a hiring process.

---

## Why this exists

Job searches are exhausting. You apply, you prep, you interview — and then you find out the company had layoffs last month, is drowning in lawsuits, or has a culture that burns people out in six months.

This tool is built for candidates who want **signal before they commit their time**.

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
- Web search enabled
- Node.js 20+ for the local web app

### Setup

1. Copy this folder into `~/.claude/commands/`
2. Open Claude Code
3. Type `/KnowYourCompany`

Claude will ask for the company name, office location (optional), your target role (optional), and also the report language (optional, English by default)then run the research and produce the report.

### Local web app

The repo also includes a lightweight web app that uses your own OpenAI API key to run the same research flow from a browser.

1. Set `OPENAI_API_KEY` in your shell or copy `.env.example` into your own environment setup
2. Optionally set `OPENAI_MODEL` (defaults to `gpt-5`) and `PORT`
3. Run `npm start`
4. Open `http://127.0.0.1:3000`

The app:

- Collects the same inputs as the skill: company, office location, target role, and report language
- Calls the OpenAI Responses API with web search enabled
- Renders the result as a self-contained HTML report in the same KnowYourCompany style
- Lets you download the generated HTML directly from the browser

---

## What it is NOT

- Not a stock screener or investment tool
- Not for financial modeling or valuation
- Not a substitute for legal or financial advice

This is built for one thing: **helping you decide where to spend your time**.

---

## Repo structure

```text
KnowYourCompany/
├── SKILL.md              — skill definition and research logic
├── README.md
├── .env.example
├── package.json
├── server.js             — local app server + OpenAI endpoint
├── lib/
│   └── report-template.js — shared report normalization + HTML renderer
├── public/
│   ├── index.html        — app shell
│   ├── styles.css        — web app styling
│   └── app.js            — browser logic
├── references/
│   ├── template.html     — report HTML skeleton
│   └── styles.css        — visual source of truth
└── examples/
    ├── Sardine_bg_check_2026-04-15.html
    └── Poki_bg_check_2026-04-15.html
```
