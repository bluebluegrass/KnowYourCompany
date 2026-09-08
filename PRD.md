# PRD: Company Background Check Skill

**Version:** 1.1
**Date:** 2026-04-15
**Status:** Draft

---

## Overview

A Claude Code skill that lets users research a company before joining, investing, or partnering. Given a company name (and optionally an office location and job role), the skill produces a self-contained HTML report covering layoffs, financial health, culture, leadership stability, legal exposure, product health, work policy, compensation, interview experience, visa sponsorship, and founder background.

---

## Problem Statement

Job seekers and investors routinely make high-stakes decisions with incomplete information. Public data is scattered across news sites, Reddit threads, Glassdoor reviews, SEC filings, Crunchbase, LinkedIn, and founder social profiles. Aggregating and interpreting this data manually takes hours and requires financial literacy most people don't have. This skill does that work in seconds and explains findings in plain language.

---

## Goals

- Surface material risks (layoffs, runway concerns, toxic culture signals, legal trouble) before a user commits to a company.
- Translate financial jargon into plain English so non-technical / non-finance users can act on the information.
- Clearly label all unverified/community-sourced content and link to original sources.
- Produce a polished, shareable HTML report — no extra tools required to view it.

## Non-Goals

- Real-time stock price tracking or financial advice.
- Coverage of private individuals who are not public-facing company founders/executives.
- Legal or compliance guidance.

---

## Inputs

| Field | Required | Description |
|---|---|---|
| `company_name` | Yes | Name of the company to research |
| `office_location` | No | City, state, or country — used to filter location-specific layoff data, RTO policy, and culture context |
| `job_role` | No | Target role — used to surface role-specific Glassdoor/Blind/Reddit signal, interview experience, and comp data |

---

## Output

A single self-contained `.html` file (no external dependencies) with the following sections:

---

### Section 1 — Recent Layoffs
- Did the company have layoffs in the past 12–24 months?
- Headcount reduction percentages and affected teams if available.
- Sources: layoffs.fyi, TechCrunch, Bloomberg, company press releases.
- If no layoffs found: explicit "No layoffs found in the past 24 months" statement.
- If `office_location` provided: call out whether the specific office was impacted.

---

### Section 2 — Financial Health *(prioritised for startups and pre-IPO companies)*
- Funding rounds: round type, amount, date, lead investor(s).
- Last known runway estimate or burn rate if publicly reported.
- Revenue trajectory or profitability signals (public filings, earnings calls, press).
- Recent financial red flags: down rounds, debt restructuring, missed payments.
- **Plain-English interpretation box** — a paragraph written for someone with no finance background explaining what the numbers mean in practical terms (e.g. "They raised $10 M 18 months ago and haven't announced new funding — for a 200-person company that's a potential concern worth asking about in interviews").
- Sources: Crunchbase, PitchBook (public data), SEC EDGAR, company IR page.

---

### Section 3 — Leadership Stability
- Current CEO, CTO, CPO, and other C-suite / VP-level leaders.
- Tenure of current leadership team.
- Departures in the past 18 months — especially clusters of senior exits, which often precede wider instability.
- Any interim or acting titles (signal of unplanned turnover).
- Founder still involved? If not, when did they leave and under what circumstances?
- Sources: LinkedIn (public profiles), Crunchbase, news archives, company press releases.
- **Plain-English flag:** if 2+ C-suite members left in the past 12 months, surface a yellow/red badge with a brief explanation of why this matters.

---

### Section 4 — Legal & Regulatory Exposure
- Active or recent lawsuits: employment discrimination, wage theft, securities fraud, class actions.
- Regulatory actions: FTC, SEC, OSHA, EEOC investigations or fines.
- Criminal proceedings involving the company or its executives.
- Any patterns (e.g. repeated labour violations, prior settlements).
- **Prominent disclaimer:** court records are public but summaries here are not legal advice.
- Sources: PACER (public federal court records), state court search tools, SEC enforcement actions, OSHA inspection records, news archives.

---

### Section 5 — Company Culture
- Summary of recurring themes from community platforms.
- Structured signal from: Glassdoor (overall rating, CEO approval, "recommend to a friend" %), Blind, relevant Reddit threads (r/cscareerquestions, r/layoffs, company-specific subreddits), LinkedIn reviews.
- If `job_role` provided: filter for reviews mentioning that role or team.
- **Prominent disclaimer banner** on every culture item: *"The following is sourced from public community posts and is unverified. Individual experiences may vary."*
- Direct links to source posts/pages for every claim.
- Topics to surface: work-life balance, management quality, DEI, compensation transparency, promotion velocity, psychological safety.

---

### Section 6 — Remote / Hybrid / RTO Policy
- Current official policy: fully remote, hybrid, or in-office.
- Has the policy changed in the past 12 months? Any announced future changes?
- If `office_location` provided: surface any location-specific policy that differs from company-wide policy.
- Community signal: are employees complaining about RTO mandates on Reddit or Blind?
- Sources: company careers page, press, Reddit, Blind.

---

### Section 7 — Compensation & Benefits
- Salary ranges if the company posts them (required in CA, NY, CO, WA, and other pay-transparency states/countries).
- Equity: stock options vs RSUs, typical vesting schedule, last known 409A or fair market value if available.
- Benefits highlights commonly mentioned in reviews: healthcare, PTO policy, parental leave.
- If `job_role` provided: surface any comp range data specific to that role from job postings or community discussion.
- Sources: company job postings, Glassdoor salary data, Levels.fyi (for tech roles), Reddit/Blind threads.
- **Disclaimer:** community salary data is self-reported and unverified.

---

### Section 8 — Interview Experience
- Typical process: number of rounds, format (take-home, system design, behavioural, etc.).
- Average time from application to offer.
- Ghosting reputation — are candidates frequently left without responses?
- Bait-and-switch signals — offers rescinded or roles changed post-offer.
- If `job_role` provided: filter for role-specific interview reports.
- Sources: Glassdoor interview reviews, Blind, Reddit, Leetcode discuss.
- **Disclaimer:** all interview reports are self-reported and unverified.

---

### Section 9 — Visa & Immigration Sponsorship
- Does the company sponsor H-1B or equivalent work visas?
- H-1B petition volume and approval rate (USCIS public data, myvisajobs.com).
- Has sponsorship policy changed recently?
- If `office_location` provided: flag country-specific work permit context.
- Sources: USCIS H-1B disclosure data, myvisajobs.com, company careers page, community reports.

---

### Section 10 — Product & Market Health
- Is the core product growing, flat, or declining?
- App store ratings (iOS / Android) if consumer-facing.
- G2 / Capterra scores if B2B SaaS.
- Recent major customer wins or losses, product pivots, significant outages, or PR crises around the product.
- Competitive position: is the market growing or contracting? Are major competitors gaining ground?
- Sources: app stores, G2/Capterra, TechCrunch, industry press.

---

### Section 11 — Company Profile & History
- What the company does in one plain-English paragraph.
- Founded: year, location, original mission.
- Key milestones: product launches, pivots, acquisitions, IPO.
- Current headcount range and business model.
- Sources: company website, Wikipedia, Crunchbase, Pitchbook.

---

### Section 12 — Founder Background & News
- Founder name(s), prior companies, educational background (publicly available).
- Notable achievements or controversies — sourced and dated.
- Recent news tied to founders: interviews, op-eds, legal proceedings, social media presence.
- Any pattern worth flagging (e.g. repeated company failures, fraud allegations, cult-of-personality warnings) — stated factually with sources, no editorialising without attribution.
- Sources: LinkedIn (public profiles), Crunchbase, news archives, public court records where applicable.

---

## HTML Report Spec

### Structure
- Single `.html` file, fully self-contained (inline CSS + JS, no CDN calls).
- Responsive layout, readable on mobile.
- Dark/light mode toggle.
- Top summary card: overall risk snapshot across all sections (green / yellow / red per section) so users can see at a glance where concerns are.
- Each section is a collapsible card with a header badge (green / yellow / red) indicating signal severity.
- "Last updated" timestamp and search parameters shown at the top.
- Footer: disclaimer that the report is for informational purposes only, not financial or legal advice.

### Visual Design
- Clean, professional aesthetic — intended to be shareable with a recruiter or team.
- Culture section: render a star rating widget for Glassdoor score.
- Financial section: simple timeline of funding rounds.
- Leadership section: simple table of current execs with tenure and any departure flags.
- All external links open in a new tab.
- Print-friendly stylesheet.

### Severity Badges
| Badge | Meaning |
|---|---|
| Green | No significant concerns found |
| Yellow | Mixed signals or limited data — worth investigating |
| Red | Material concern identified (recent mass layoffs, runway < 6 months, multiple fraud allegations, active class action, etc.) |
| Grey | Insufficient data to assess |

---

## Research Execution Plan

The skill will use `WebSearch` and `WebFetch` to gather data in parallel across twelve research tracks:

1. **Layoff track** — `"{company} layoffs 2024 OR 2025"`, layoffs.fyi
2. **Financial track** — Crunchbase, SEC EDGAR, recent funding news
3. **Leadership track** — LinkedIn current team, news for `"{company} CEO left"` / `"{company} CTO departure"`
4. **Legal track** — `"{company} lawsuit OR settlement OR SEC OR OSHA OR class action"`, PACER public records
5. **Culture track** — Glassdoor, Blind, Reddit (`site:reddit.com OR site:glassdoor.com OR site:teamblind.com`)
6. **RTO/work policy track** — `"{company} return to office OR remote policy OR hybrid 2024 OR 2025"`, company careers page
7. **Compensation track** — company job postings (salary ranges), Glassdoor salary, Levels.fyi
8. **Interview track** — Glassdoor interview reviews, `site:reddit.com "{company}" interview`
9. **Visa track** — myvisajobs.com, `"{company}" H-1B sponsorship`
10. **Product track** — app store pages, G2/Capterra, `"{company}" product news`
11. **Company profile track** — company website About page, Wikipedia
12. **Founder track** — founder name + company in news, LinkedIn public profiles

Each search result URL is fetched for full content where possible. All fetched URLs are included in the report as source citations.

---

## Skill Interface

### Invocation
```
/bg-check
```

### Prompt Flow
The skill will interactively ask for:
1. Company name (required)
2. Office location (optional — press Enter to skip)
3. Job role (optional — press Enter to skip)

Then it will run research and write the HTML report to the current working directory as `{company_name}_bg_check_{date}.html`.

---

## Constraints & Guardrails

- **No private individual data** beyond what is publicly indexed.
- **No speculation** on financial data — if data is unavailable, say so explicitly.
- **No hallucinated citations** — every claim must trace to a fetched URL.
- **Rate limiting** — searches are batched by track to avoid hammering sources; typical run time 90–180 seconds.
- Culture, interview, and compensation sections always carry the unverified disclaimer regardless of source quality.
- Legal section always carries the "not legal advice" disclaimer.

---

## Success Criteria

- A user with no finance background can read the report and understand whether the company is a financial risk.
- Every factual claim in the report has a clickable source link.
- The HTML file opens correctly in any modern browser without an internet connection.
- Report generation completes in under 4 minutes for a well-indexed company.
- Sections with no data found display a "Insufficient data" grey badge rather than omitting the section.

---

## Open Questions

1. Should we support batch mode (multiple companies at once)?
2. Should the report include a "questions to ask in your interview" section derived from the findings?
3. Localisation — for non-US companies, which financial and legal data sources do we fall back to?
4. Should there be a confidence score per section based on data availability?

---

## Out of Scope for v1

- Automated monitoring / alerts when new layoff news drops for a watched company.
- Competitor comparison mode.
- PDF export (HTML print-to-PDF covers this use case for now).
- Alumni trajectory (where ex-employees go next) — limited data availability.
