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

---

## How to use it

### Requirements

- [Claude Code](https://claude.ai/code)
- Web search enabled

### Setup

1. Copy this folder into `~/.claude/commands/`
2. Open Claude Code
3. Type `/KnowYourCompany`

Claude will ask for the company name, office location (optional), and your target role (optional), then run the research and produce the report.

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
├── references/
│   ├── template.html     — report HTML skeleton
│   └── styles.css        — visual source of truth
└── examples/
    ├── Sardine_bg_check_2026-04-15.html
    └── Poki_bg_check_2026-04-15.html
```
