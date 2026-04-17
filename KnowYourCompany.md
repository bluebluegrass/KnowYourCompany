# KnowYourCompany

You are conducting a comprehensive company background check and will produce a self-contained HTML report.

## Step 1 — Collect Inputs

Ask the user the following questions one at a time, then proceed once you have the answers:

1. **Company name** (required): "What company would you like to research?"
2. **Office location** (optional): "Which office location are you considering? (city, state, or country — type 'any' to skip)"
3. **Job role** (optional): "What role are you considering? (e.g. Software Engineer, Product Manager — type 'any' to skip)"
4. **Report language**: "What language should the report be written in? (e.g. English, Dutch, French, Japanese, Chinese — type 'English' if unsure)"

Store these as:
- `COMPANY` = company name
- `LOCATION` = office location (may be empty)
- `ROLE` = job role (may be empty)
- `OUTPUT_LANG` = the language for all report text (default: English). Examples: English (`en`), Dutch (`nl`), German (`de`), French (`fr`), Japanese (`ja`), Chinese Simplified (`zh`), Portuguese (`pt`), Spanish (`es`).

**Determine local language.** Based on `COMPANY` and `LOCATION`, identify the primary language(s) of the country where the company is headquartered or where the target office is located. Store this as `LOCAL_LANG`. Examples: Netherlands / Amsterdam → Dutch (`nl`); Germany → German (`de`); France → French (`fr`); Japan → Japanese (`ja`); Brazil → Portuguese (`pt`); Spain → Spanish (`es`). If the country is primarily English-speaking (US, UK, Australia, Canada, Ireland, New Zealand, Singapore), set `LOCAL_LANG = en` and skip all local-language searches.

Note: `LOCAL_LANG` controls the language used for *searching* (so you find local sources). `OUTPUT_LANG` controls the language used for *writing the report*. They are independent — a user can research a Dutch company and want the report in English, or research a US company and want the report in French.

Tell the user: "Researching **{COMPANY}**. This will take 2–3 minutes — I'll run 12 research tracks in parallel."

---

## Step 2 — Research

Use WebSearch and WebFetch to gather data across all 12 tracks below. Run as many searches in parallel as possible. For every piece of information you include in the report, you MUST record the source URL. Never include a claim without a traceable URL — if you cannot find a source, say "No data found."

### Local-language search rule (applies to ALL tracks)
If `LOCAL_LANG ≠ en`, run an additional local-language version of every search query in that track — in parallel with the English searches. Translate key terms into the local language (e.g. "ontslagen" for layoffs in Dutch, "procès" for lawsuit in French). When you find results, read the content and incorporate it into the report. If `OUTPUT_LANG` differs from the source language, translate into `OUTPUT_LANG` and mark with `[translated from {language}]` so the source is transparent. Local-language sources that are trustworthy (national newspapers, company filings, government registers, local job platforms) often surface information that English searches miss entirely — treat them as equally valid.

**Useful local platforms to add per country** (search in local language):
- Netherlands: Intermediair, Nationale Vacaturebank, FNV (union), Tweakers (for tech cos), De Telegraaf, NRC, RTL Nieuws
- Germany: XING, Kununu, Handelsblatt, Tagesspiegel, Spiegel
- France: Cadremploi, APEC, Les Échos, Le Monde, Glassdoor.fr
- Spain / LATAM: Infojobs, Expansion, El Pais
- Japan: Nikkei, JobsInJapan, 転職会議 (Tensyoku Kaigi)
- Brazil: Glassdoor.com.br, Vagas.com, Exame, Folha

### Track 1 — Layoffs
- Search: `"{COMPANY}" layoffs 2024 OR 2025`
- Search: `site:layoffs.fyi "{COMPANY}"`
- Fetch the Layoffs.fyi page if a result is found.
- If `LOCAL_LANG ≠ en`: Search local-language equivalent (e.g. Dutch: `"{COMPANY}" ontslagen OR reorganisatie 2024 OR 2025`; German: `"{COMPANY}" Entlassungen OR Stellenabbau 2024 OR 2025`; French: `"{COMPANY}" licenciements OR suppressions de postes 2024 OR 2025`).
- Record: dates, headcount reduction %, affected teams.
- If `LOCATION` is set: note whether that office was specifically mentioned.

### Track 2 — Financial Health
- Search: `"{COMPANY}" funding round OR valuation OR Series OR IPO 2023 OR 2024 OR 2025`
- Search: `"{COMPANY}" site:crunchbase.com`
- Search: `"{COMPANY}" revenue OR profitability OR burn rate OR runway`
- Search: `"{COMPANY}" SEC filing OR earnings OR annual report` (for public companies)
- If `LOCAL_LANG ≠ en`: Search the national business registry or chamber of commerce for the company's annual accounts (e.g. Netherlands: KvK jaarrekening; Germany: Bundesanzeiger Jahresabschluss; France: Infogreffe bilan). These often contain revenue, profit/loss, and employee count that are not in English sources. Also search local financial press (e.g. `"{COMPANY}" omzet OR winst` for Dutch; `"{COMPANY}" Umsatz OR Gewinn` for German).
- Record: all funding rounds (type, amount, date, lead investors), revenue signals, red flags (down rounds, debt restructuring).

### Track 3 — Leadership Stability
- Search: `"{COMPANY}" CEO OR CTO OR CPO departed OR resigned OR left OR fired 2023 OR 2024 OR 2025`
- Search: `"{COMPANY}" leadership team`
- Fetch the company LinkedIn page or About/Team page if findable.
- Record: current C-suite names and titles, any recent departures, whether founder is still involved.

### Track 4 — Legal & Regulatory Exposure
- Search: `"{COMPANY}" lawsuit OR class action OR settlement 2023 OR 2024 OR 2025`
- Search: `"{COMPANY}" SEC enforcement OR FTC investigation OR OSHA violation OR EEOC`
- Search: `"{COMPANY}" wage theft OR discrimination lawsuit OR fraud`
- If `LOCAL_LANG ≠ en`: Search local-language equivalents for legal exposure (e.g. Dutch: `"{COMPANY}" rechtszaak OR rechtbank OR boete OR AVG overtreding`; German: `"{COMPANY}" Klage OR Gericht OR Bußgeld OR Datenschutz`; French: `"{COMPANY}" procès OR tribunal OR amende OR CNIL`). Also search the national data protection authority (e.g. AP for Netherlands, CNIL for France, BfDI for Germany) for any published enforcement decisions involving the company.
- Record: case names, dates, outcomes, any patterns.

### Track 5 — Company Culture
- Search: `"{COMPANY}" site:glassdoor.com reviews`
- Search: `"{COMPANY}" site:teamblind.com`
- Search: `site:reddit.com "{COMPANY}" culture OR management OR toxic OR layoffs`
- If `ROLE` is set, add: `site:reddit.com "{COMPANY}" "{ROLE}"`
- Fetch Glassdoor overview page for overall rating, CEO approval %, "recommend to a friend" %.
- If `LOCAL_LANG ≠ en`: Search the dominant local review platform (e.g. Netherlands/Germany: Kununu; France: Glassdoor.fr + JobAdsVisor; Spain: Infojobs reviews; Japan: 転職会議). Also search local-language forums or Reddit equivalents (e.g. Dutch: `"{COMPANY}" werksfeer OR management site:reddit.com/r/nl` or `"{COMPANY}" werken ervaringen`).
- Record: recurring positive and negative themes, direct quotes with their source URLs. Label local-language quotes with `[translated from {language}]`.

### Track 6 — Remote / Hybrid / RTO Policy
- Search: `"{COMPANY}" return to office OR remote work policy OR hybrid 2024 OR 2025`
- Search: `site:reddit.com "{COMPANY}" RTO OR remote OR hybrid`
- Fetch the company careers page for current policy statement.
- If `LOCATION` is set: check for location-specific policy.
- Record: official policy, any recent changes, employee sentiment.

### Track 7 — Compensation & Benefits
- Search: `"{COMPANY}" salary range OR pay transparency OR compensation`
- If `ROLE` is set: Search `"{COMPANY}" "{ROLE}" salary OR compensation OR equity`
- Search: `site:levels.fyi "{COMPANY}"` (for tech roles)
- Fetch any job postings for `COMPANY` that include salary ranges.
- If `LOCAL_LANG ≠ en`: Search local salary benchmarking sites (e.g. Netherlands: Loonwijzer.nl, Nationale Vacaturebank salarischeck; Germany: Gehalt.de, StepStone Gehaltsreport; France: Glassdoor.fr, Cadremploi; Spain: Infojobs salarios). Also search local-language job postings which may include mandatory salary disclosure (e.g. EU Pay Transparency Directive affects Dutch, German, French postings from 2026).
- Record: salary bands if found, equity type (options vs RSUs), vesting schedule, notable benefits.

### Track 8 — Interview Experience
- Search: `"{COMPANY}" interview process OR interview experience site:glassdoor.com`
- Search: `site:reddit.com "{COMPANY}" interview OR hiring process OR offer rescinded OR ghosted`
- If `ROLE` is set: Search `"{COMPANY}" "{ROLE}" interview`
- Record: number of rounds, format, average timeline, ghosting or bait-and-switch reports.

### Track 9 — Visa & Immigration Sponsorship
- If `LOCATION` is in the United States or the user is considering US employment:
  - Search: `"{COMPANY}" H-1B sponsorship OR PERM OR visa sponsorship`
  - Search: `site:myvisajobs.com "{COMPANY}"`
  - Fetch myvisajobs.com and USCIS-related results if available.
  - Record: whether they sponsor, petition volume, approval rate, job titles if visible, and any recent policy changes.
- If `LOCATION` is in the United Kingdom:
  - Search: `"{COMPANY}" Skilled Worker visa sponsorship OR sponsor licence`
  - Search: `site:gov.uk "{COMPANY}" sponsor licence`
  - Search: `"{COMPANY}" visa sponsorship UK jobs`
  - Fetch UK government sponsor register results or company careers pages if available.
  - Record: whether they appear to hold a sponsor licence, what roles mention sponsorship, and any recent policy changes.
- If `LOCATION` is in the Netherlands:
  - Search: `"{COMPANY}" kennismigrant sponsorship OR visa sponsorship Netherlands`
  - Search: `site:ind.nl "{COMPANY}" erkend referent`
  - Search: `"{COMPANY}" highly skilled migrant sponsorship`
  - Fetch IND recognised sponsor results or company careers pages if available.
  - Record: whether they appear to be a recognised sponsor, what Dutch immigration path is relevant, and any recent policy changes.
- If `LOCATION` is in Germany:
  - Search: `"{COMPANY}" visa sponsorship Germany OR Blue Card`
  - Search: `"{COMPANY}" work permit sponsorship Germany jobs`
  - Fetch company careers pages and official guidance if available.
  - Record: whether roles explicitly support work authorisation, whether EU Blue Card or skilled worker routes are relevant, and any recent policy changes.
- If `LOCATION` is in Canada:
  - Search: `"{COMPANY}" LMIA OR work permit sponsorship Canada`
  - Search: `"{COMPANY}" global talent stream sponsorship`
  - Fetch company careers pages and official guidance if available.
  - Record: whether they mention sponsorship, which pathway appears relevant, and any recent policy changes.
- If `LOCATION` is in Australia:
  - Search: `"{COMPANY}" TSS 482 sponsorship OR visa sponsorship Australia`
  - Search: `"{COMPANY}" employer sponsored visa jobs Australia`
  - Fetch company careers pages and official guidance if available.
  - Record: whether they sponsor, which employer-sponsored pathway appears relevant, and any recent policy changes.
- If `LOCATION` is elsewhere or unspecified:
  - Search: `"{COMPANY}" visa sponsorship "{LOCATION}"` when `LOCATION` is provided.
  - Search: `"{COMPANY}" immigration sponsorship OR work permit sponsorship jobs`
  - Search for the country’s dominant employer-sponsored route rather than defaulting to H-1B.
  - Fetch the company careers page and the relevant official immigration source if available.
  - Record: whether they sponsor, which country-specific program is relevant, and any recent policy changes.
- In all cases: prefer the official immigration authority and company careers pages over third-party aggregators, and name the exact local visa or employer-sponsorship program in the report rather than using generic “visa sponsorship” language.

### Track 10 — Product & Market Health
- Search: `"{COMPANY}" product reviews OR app rating OR G2 OR Capterra`
- Search: `"{COMPANY}" customer OR market growth OR pivot OR outage OR controversy 2024 OR 2025`
- If consumer app: fetch App Store or Google Play page.
- If B2B: search `site:g2.com "{COMPANY}"` and `site:capterra.com "{COMPANY}"`.
- Record: rating scores, review themes, major incidents, competitive position.

### Track 11 — Company Profile & History
- Fetch: the company's official website (homepage + About/About Us page).
- Search: `"{COMPANY}" Wikipedia`
- Fetch Wikipedia page if it exists.
- Search: `"{COMPANY}" founded history milestones`
- Record: what the company does, founding year and location, key milestones, current headcount range, business model.

### Track 12 — Founder Background
- Search: `"{COMPANY}" founder name`
- Once you have founder names: Search `{founder_name} background OR education OR prior company OR controversy OR news`
- Search: `{founder_name} site:linkedin.com` (public profile)
- Search: `{founder_name} lawsuit OR fraud OR investigation`
- Record: prior companies, education, notable achievements, controversies (sourced only, no editorialising).

---

## Step 3 — Assess Severity Per Section

For each of the 12 sections, assign a badge:
- **RED** — material concern (examples: layoffs >10% in past 6 months, runway <6 months, active class action, CEO fired abruptly, multiple fraud allegations, product rating <3.0)
- **YELLOW** — mixed signals or limited data worth investigating
- **GREEN** — no significant concerns found
- **GREY** — insufficient data to assess

---

## Step 4 — Write the report JSON

Write a file named `{COMPANY}_KnowYourCompany_{YYYY-MM-DD}.report.json` (use today's date, replace spaces in company name with underscores) in the current working directory.

The file is a flat JSON object. Every key maps directly to one `{{ PLACEHOLDER }}` in `references/template.html`. Write all prose values in `OUTPUT_LANG`.

**Required keys and what to write for each:**

```
COMPANY          — company name (plain text)
DATE             — today's date as YYYY-MM-DD
LOCATION         — office location, or empty string
ROLE             — role, or empty string
VERDICT_TEXT     — 3–5 sentences directly answering "Is this a safe company to join right now?"
                   Lead with the most important finding. Be specific, no hedging.
VERDICT_FLAGS    — one <span class="verdict-flag {color}">{icon} {label}</span> per notable finding.
                   Use red/yellow/green. List red first.
                   e.g. "<span class=\"verdict-flag green\">✓ Series C funded</span>"

B1 … B12         — badge color for each section: green | yellow | red | grey
B1_LABEL … B12_LABEL — badge label in OUTPUT_LANG:
                   English: No concerns / Mixed signals / Concern found / No data

LAYOFFS_CONTENT      — HTML (<p>, <ul><li>) summarising layoff findings
LAYOFFS_SOURCES      — <li><a href="URL" target="_blank">Title</a></li> for each source

FUNDING_TIMELINE     — one <div class="timeline-item"><strong>Round</strong><span>Date · Amount · Investors</span></div> per round, oldest first
FINANCIAL_SIGNALS    — HTML summarising financial health findings
FINANCIAL_PLAIN_ENGLISH — 2–3 plain-language sentences explaining the financial picture
FINANCIAL_SOURCES    — sources list

LEADERSHIP_CURRENT   — HTML describing current C-suite
LEADERSHIP_DEPARTURES — HTML listing recent departures
LEADERSHIP_SOURCES   — sources list

LEGAL_CONTENT        — HTML summarising legal/regulatory findings
LEGAL_SOURCES        — sources list

GLASSDOOR_RATINGS    — zero or more <div class="rating-row"><span>Label</span><span>Value</span></div>
CULTURE_THEMES       — HTML summarising culture themes
CULTURE_COMMUNITY    — HTML with notable quotes or community findings
CULTURE_SOURCES      — sources list

RTO_OFFICIAL         — HTML describing the official remote/hybrid policy
RTO_CHANGES          — HTML listing recent policy changes
RTO_SENTIMENT        — HTML summarising employee sentiment
RTO_SOURCES          — sources list

COMP_SALARY          — HTML describing salary signals
COMP_EQUITY          — HTML describing equity / vesting
COMP_BENEFITS        — HTML describing notable benefits
COMP_SOURCES         — sources list

INTERVIEW_CONTENT    — HTML summarising interview process findings
INTERVIEW_SOURCES    — sources list

VISA_CONTENT         — HTML summarising visa sponsorship findings
VISA_SOURCES         — sources list

PRODUCT_CONTENT      — HTML summarising product and market health
PRODUCT_SOURCES      — sources list

PROFILE_SUMMARY      — HTML with company overview and history
PROFILE_MILESTONES   — HTML listing key milestones
PROFILE_SOURCES      — sources list

FOUNDER_CONTENT      — HTML summarising founder backgrounds
FOUNDER_SOURCES      — sources list
```

**Rules:**
- All HTML values must use `<p>`, `<ul><li>`, `<table>` — no markdown.
- Escape double quotes inside JSON string values with `\"`.
- If a section has no data, write `<p>No data found for this section.</p>` and set its badge to `grey` / `No data`.
- Never invent URLs. Only include URLs you actually fetched or searched.

---

## Step 5 — Render the HTML

After writing the JSON, run:

```bash
node references/render.js {COMPANY}_KnowYourCompany_{YYYY-MM-DD}.report.json
```

This script reads the JSON and `references/template.html`, substitutes every placeholder, inlines the CSS, and writes `{COMPANY}_KnowYourCompany_{YYYY-MM-DD}.html`. It will error if any placeholder is left unfilled.

---

## Step 6 — Confirm Output

After the script runs, tell the user:

> "Report saved as `{filename}.html`. Open it in any browser — no internet connection needed.
>
> **Risk snapshot:**
> - 🔴 Red flags: [list section names with red badges, or "none"]
> - 🟡 Worth investigating: [list yellow sections, or "none"]
> - ⚪ No data: [list grey sections, or "none"]"
