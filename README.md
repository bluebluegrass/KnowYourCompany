# KnowYourCompany

**Stop wasting interviews on companies that are quietly falling apart.**

KnowYourCompany is now a **token-efficient Node/TypeScript pipeline** for researching a company and generating a polished, self-contained HTML due diligence report while keeping Claude focused on the nuanced writing and judgment work.

## Architecture overview

The old version delegated almost everything to one Claude prompt. The refactor moves deterministic work into code:

1. Input normalization
2. Query planning with section-aware recency budgets
3. Retrieval and fetch in code
4. Page cleaning and snippet extraction in code
5. Evidence dedupe and ranking in code
6. Compact evidence packet creation per section
7. Claude section analysis on structured packets only
8. Small final-summary Claude call
9. Late translation of final user-facing prose and deterministic HTML rendering in code

Claude no longer fills HTML templates, inlines CSS, or reviews full raw pages by default.

## Where token savings come from

- Large raw pages are replaced with compact evidence packets
- One monolithic prompt is replaced by short section-specific prompts
- Search, recency filtering, dedupe, and rendering happen outside Claude
- Cached fetches, packets, and section analyses prevent repeated model work
- Translation happens late on final user-facing prose instead of repeatedly inside retrieval and analysis

## Quality safeguards

- Every rendered source URL comes from the canonical fetched source registry
- Sections with insufficient evidence automatically render as grey
- Community-sourced sections retain explicit disclaimers
- Legal retains an informational disclaimer
- Finance still includes a plain-English explanation
- The final report stays self-contained and offline-safe
- Final summary and section prose can now be translated late when `outputLanguage` differs from the canonical working language

## Caching

Cache layers live in `.cache/`:

- fetched pages by normalized URL hash
- section evidence packets by company + section + source hashes
- section analyses by company + section + evidence hash + prompt version
- final summary by analyzed section outputs

Invalidation is versioned in code via `CACHE_VERSIONS`.

## Quality vs cost tuning

Main levers:

- evidence cap per section
- search result cap per query
- selective local-language search only for high-value sections
- recency window defaults to the past 24 months for time-sensitive sections
- reuse via cache instead of re-running analysis

## Prompts

Prompts are split under `src/prompts/`:

- one prompt module per report section
- one final-summary prompt

Each prompt consumes structured evidence only and returns structured JSON.

Late-stage translation is handled after section analysis and final-summary synthesis. Fixed UI labels are localized through a built-in dictionary for supported languages.

## Usage

### Requirements

- Node.js 20+
- `ANTHROPIC_API_KEY`

### Install

```bash
npm install
```

### Run tests

```bash
npm test
```

### Generate a report

```bash
npm run report -- --company "Stripe" --location "Amsterdam, Netherlands" --role "Product Designer" --language "English"
```

If you omit arguments, the CLI will prompt interactively.

## Repo structure

```text
KnowYourCompany/
├── KnowYourCompany.md
├── README.md
├── docs/
│   └── refactor-note.md
├── references/
│   ├── template.html
│   └── styles.css
├── src/
│   ├── cli.ts
│   ├── cache/
│   ├── config/
│   ├── evidence/
│   ├── localization/
│   ├── logging/
│   ├── model/
│   ├── prompts/
│   ├── render/
│   ├── report/
│   ├── retrieval/
│   └── types/
└── tests/
```
