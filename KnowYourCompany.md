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

## Step 4 — Generate HTML Report

Write a file named `{COMPANY}_KnowYourCompany_{YYYY-MM-DD}.html` (use today's date, replace spaces in company name with underscores) in the current working directory.

The file must be **fully self-contained** — no external CSS, JS, or font CDN links. Everything inline.

**Use `references/template.html` as the canonical starting structure.** Before writing the output file:
1. Read `references/template.html` to get the exact HTML skeleton and placeholder list.
2. Read `references/styles.css` and paste its full contents into the `<style>` block of the output file (replacing the placeholder comment).
3. Set the `<html lang="...">` attribute to the BCP 47 code for `OUTPUT_LANG` (e.g. `en`, `nl`, `de`, `fr`, `ja`, `zh`, `pt`, `es`).
4. Replace every `{{ }}` placeholder with your researched content in `OUTPUT_LANG`. Never leave a placeholder unfilled.

---

## Step 5 — Fill In The Template

**Write all report content in `OUTPUT_LANG`.** This includes section headings, prose, badge labels, disclaimers, the plain-English financial box, and the footer. The only exceptions are:
- Source link anchor text (keep the original page title)
- HTML attributes, CSS class names, and JavaScript (always English)
- The `<html lang="...">` attribute (set to the BCP 47 code for `OUTPUT_LANG`, e.g. `nl`, `de`, `fr`, `ja`, `zh`, `en`)

If `OUTPUT_LANG` is not English, also translate the fixed UI strings in the template: section titles (e.g. "Recent Layoffs" → Dutch: "Recente ontslagen"), badge labels (e.g. "No concerns" → "Geen zorgen"), disclaimer text, footer text, and the "Toggle Dark Mode" button label.

Replace every `{{ }}` placeholder with your researched content:

- For `{{ VERDICT_TEXT }}`: write 3–5 sentences in `OUTPUT_LANG` that directly answer "Is this a safe company to join right now?" Lead with the most important finding. Be specific — name the actual concern (e.g. "Sardine is well-funded and fully remote, but interview data is thin and equity terms are unclear."). Do not pad with hedges.
- For `{{ VERDICT_FLAGS }}`: write one `<span class="verdict-flag {color}">{icon} {label}</span>` per notable finding. Use `red` for material concerns, `yellow` for mixed signals, `green` for clear positives. List red first. Examples: `<span class="verdict-flag red">🚨 Active regulatory action</span>`, `<span class="verdict-flag yellow">⚠️ Culture: mixed reviews</span>`, `<span class="verdict-flag green">✓ Series C funded, strong runway</span>`.
- For each section's main content block: write clean HTML paragraphs (`<p>`), lists (`<ul><li>`), and tables (`<table>`) as appropriate. Do not use markdown inside the HTML.
- For each `{{ BADGE_X }}` placeholder: use one of `green`, `yellow`, `red`, or `grey` (lowercase, no spaces).
- For each `{{ BADGE_X_LABEL }}` placeholder: use the appropriate label in `OUTPUT_LANG` (e.g. English: `No concerns` / `Mixed signals` / `Concern found` / `No data`; Dutch: `Geen zorgen` / `Gemengde signalen` / `Zorgpunt` / `Geen data`; French: `Aucun problème` / `Signaux mitigés` / `Point d'attention` / `Données insuffisantes`).
- For each sources block: write `<li><a href="URL" target="_blank">Page title or description</a></li>` for every URL you fetched. If a section had no sources, write `<li>No sources found</li>`.
- For the funding timeline: write one `<div class="timeline-item">` per funding round, oldest first.
- For the Glassdoor ratings: use the `<div class="rating-row">` pattern shown in the template comment.
- For the plain-English financial box: write 2–3 sentences in everyday language in `OUTPUT_LANG`, as if explaining to a friend with no finance background.

**Critical rules:**
- Never invent URLs. Only link to pages you actually fetched or searched.
- If a section has no data at all, write: `<p>No data found for this section.</p>` and assign a grey badge.
- Do not leave any `{{ }}` placeholders in the final file — replace or remove all of them.
- The final HTML file must be valid and render correctly in a browser with no internet connection.

---

## Step 6 — Confirm Output

After writing the file, tell the user:

> "Report saved as `{filename}.html`. Open it in any browser — no internet connection needed.
>
> **Risk snapshot:**
> - 🔴 Red flags: [list section names with red badges, or "none"]
> - 🟡 Worth investigating: [list yellow sections, or "none"]
> - ⚪ No data: [list grey sections, or "none"]"
