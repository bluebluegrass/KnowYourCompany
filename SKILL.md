---
name: KnowYourCompany
description: "Research a company and generate a polished, self-contained HTML background check report from public sources. Use this skill when someone wants due diligence on a company before joining, interviewing, investing, or partnering, or when they ask for a company risk report, employer background check, startup diligence, or hiring diligence."
---

# KnowYourCompany

Generate a single-file HTML report that helps a user assess a company using public information. The report should be readable by non-experts and should clearly separate verified reporting from community-sourced signal.

The output must be one self-contained `.html` file that opens locally in a browser without external CSS or JS dependencies.

## First-Run Behavior

When this skill is triggered without enough input, ask for:

1. Company name
2. Office location, optional
3. Target job role, optional

Then say:

> Researching **{COMPANY}**. This will take 2-3 minutes. I’ll run the research in parallel and generate a self-contained HTML report.

## What This Skill Produces

The report covers:

1. Recent layoffs
2. Financial health
3. Leadership stability
4. Legal and regulatory exposure
5. Company culture
6. Remote / hybrid / RTO policy
7. Compensation and benefits
8. Interview experience
9. Visa and immigration sponsorship
10. Product and market health
11. Company profile and history
12. Founder background and news

Each section must have:

- A severity badge: `green`, `yellow`, `red`, or `grey`
- Clear prose for the finding
- Direct source links for every factual claim
- A visible disclaimer where the data is community-sourced or legal in nature

## Required Workflow

### Phase 1: Gather Inputs

Store:

- `COMPANY`
- `LOCATION`
- `ROLE`

If `LOCATION` or `ROLE` is blank, proceed without it.

### Phase 2: Research

Use web search and page fetching to gather information in parallel. Do not include a claim unless you have a traceable source URL.

Research tracks:

1. Layoffs: `"{COMPANY}" layoffs 2024 OR 2025 OR 2026`, layoffs databases, news, company statements
2. Financial health: funding rounds, valuation, revenue, profitability, burn, runway, SEC/IR pages
3. Leadership: current executives, founder involvement, recent departures
4. Legal: lawsuits, settlements, regulatory actions, enforcement records
5. Culture: Glassdoor, Blind, Reddit, role-specific review signal
6. Work policy: official remote/hybrid/RTO policy and recent changes
7. Compensation: salary ranges, equity model, benefits, role-specific compensation data
8. Interview experience: rounds, format, timeline, ghosting, rescinded offers
9. Visa: sponsorship status, H-1B or local equivalent signal
10. Product health: ratings, outages, growth, pivots, customer signal, competitive position
11. Company profile: company description, founding, milestones, business model, headcount
12. Founder background: prior companies, education, notable achievements or controversies

### Phase 3: Assess Severity

Badge rules:

- `red`: material concern found
- `yellow`: mixed signal, limited data, or something worth probing
- `green`: no meaningful concerns found
- `grey`: insufficient data to assess

Examples of `red`:

- Layoffs above 10% in the last 6 months
- Multiple recent senior departures
- Active class action or fraud allegations with credible sourcing
- Runway concerns or obvious financial distress
- Product health collapse or severe customer backlash

### Phase 4: Build the HTML Report

Write:

```text
{COMPANY}_KnowYourCompany_{YYYY-MM-DD}.html
```

to the current working directory, replacing spaces in the company name with underscores.

Before generating the file:

1. Read `references/template.html`
2. Read `references/styles.css`

Use them as the structure and visual source of truth.

Requirements:

- Inline all CSS and JS
- No external frameworks or CDNs
- Responsive on desktop and mobile
- Dark mode toggle
- Collapsible sections
- Summary grid at the top
- Print-friendly styles
- All links open in a new tab

## Content Rules

### Source Discipline

- Every factual claim needs a URL
- If no evidence is available, say `No data found`
- Never invent citations
- Clearly distinguish reporting from community posts

### Disclaimer Rules

Culture, compensation, and interview sections must include a disclaimer that community data is self-reported or unverified.

Legal sections must include a disclaimer that the report is informational only and not legal advice.

### Plain-English Requirement

The financial section must include a short plain-English explanation for a non-finance reader that explains what the findings mean in practical terms.

### Role and Location Sensitivity

If `ROLE` is provided, use it to prioritize culture, interview, and compensation signal.

If `LOCATION` is provided, use it to prioritize layoffs, work policy, legal context, and visa information when relevant.

## Template Expectations

When filling the template:

- Replace all placeholders
- Do not leave any `{{ ... }}` tokens behind
- If a section has no data, keep the section and mark it `grey`
- Keep the report polished and shareable

## Final Validation

Before finishing:

1. Confirm the file is self-contained
2. Confirm all placeholders are replaced
3. Confirm every section has a badge
4. Confirm every section includes sources or explicit no-data language
5. Confirm the HTML filename matches the required naming format

## Repo Structure

```text
KnowYourCompany/
├── SKILL.md
├── README.md
└── references/
    ├── styles.css
    └── template.html
```
