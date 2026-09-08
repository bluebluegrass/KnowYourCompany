# KnowYourCompany

**Stop wasting interviews on companies that are quietly falling apart.**

KnowYourCompany is a portable research skill for any AI agent with web-research and local-file capabilities. It generates a structured offline HTML report so you know what you're walking into before you spend weeks in a hiring process.

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

A single HTML file that opens in any browser — no login or internet connection required after it is generated.

- A compact **“Worth a first call?”** answer tailored to the candidate profile
- The few signals that deserve attention now
- A focused **“Confirm during the first call”** checklist
- Findings that are safe to deprioritize
- A plain-language financial snapshot
- Evidence and source links for every research area
- A responsive table of contents: fixed on desktop and easy to use on mobile

---

## How it works

The AI does the research and judgment. It writes a compact `.report.json`; the local renderer deterministically turns that artifact into a self-contained `.html` file. This means report design can be improved and re-rendered without paying for another research run.

## Use with any tool-capable AI

The canonical workflow lives in [`.agents/skills/know-your-company/SKILL.md`](./.agents/skills/know-your-company/SKILL.md). Open this repository in an AI environment that can search the web, read pages and create local files, then ask it to use the skill.

```text
Use the know-your-company skill to research Marktlink Capital for an Analytics Engineer role in Amsterdam.
I need visa sponsorship and prefer a hybrid role. Write the report in English,
save a JSON artifact, then render the final HTML report.
```

The skill works with the agent's own research tools; it does not require a particular AI vendor, SDK or authentication setup. An agent without web-search or page-fetch capability can still work from source links you provide, but it cannot independently produce a verified research report.

## Example

The repository includes a full example for a Netherlands-based Analytics Engineer opportunity:

- [Marktlink report (HTML)](./examples/Marktlink_Capital_KnowYourCompany_2026-09-08.html)
- [Marktlink report data (JSON)](./examples/Marktlink_Capital_KnowYourCompany_2026-09-08.report.json)

## Project structure

```text
KnowYourCompany/
├── .agents/skills/know-your-company/  # Portable research workflow
├── src/                               # TypeScript report pipeline and renderer
├── tests/                             # Schema, evidence, and renderer tests
├── examples/                          # Curated report fixtures
├── scripts/                           # Test and preview helpers
└── package.json
```

## Quality boundaries

KnowYourCompany summarizes public evidence; it does not establish undisputed facts about a company or individual. It distinguishes direct company or regulatory evidence from third-party reporting and community accounts, and treats uncertainty as a reason to ask a focused question rather than as proof of a problem.

It is not legal, immigration, investment or financial advice.
