# KnowYourCompany

A Claude Code skill that researches a company and generates a polished, self-contained HTML background check report.

Point it at a company name. Get back a single offline HTML report covering layoffs, financial health, leadership stability, legal risk, culture, compensation, interview experience, visa sponsorship, product health, company history, and founder background.

## Who Is This For?

People doing practical diligence before:

- joining a company
- entering an interview process
- accepting an offer
- investing in or partnering with a startup

The report is designed for someone who wants signal quickly, not a pile of scattered tabs.

## What The Output Looks Like

The output is a single HTML file with:

- a top-level risk summary grid
- collapsible sections with severity badges
- inline citations to public sources
- a plain-English finance interpretation
- dark mode support
- responsive layout and print-friendly styling

## How To Use

### As a Claude Code skill

1. Copy this folder into `~/.claude/skills/`
2. Open Claude Code
3. Ask for a company background check

### Trigger phrases

- "Do a background check on this company"
- "Research this employer before I interview"
- "Make a company diligence report"
- "Check this startup before I join"
- "Generate a company risk report"

## Skill Structure

```text
KnowYourCompany/
├── SKILL.md
├── README.md
├── PRD.md
├── examples/
│   └── Poki_bg_check_2026-04-15.html
└── references/
    ├── styles.css
    └── template.html
```

## Repo Notes

- `SKILL.md` is the canonical skill entrypoint.
- `references/template.html` defines the report structure.
- `references/styles.css` is the visual source of truth for the generated report.
- `examples/` contains sample output, not source logic.
- `PRD.md` contains the longer product and scope spec.

## Requirements

- Claude Code
- Web search capability
- Permission to fetch source pages during research

## Publish Checklist

- Add a `LICENSE`
- Test the skill once from a clean `~/.claude/skills/` install
- Decide whether to keep or remove the sample report before publishing
