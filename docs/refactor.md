PRD: Two-Phase Pipeline — Research → JSON → HTML
Problem
The current pipeline is a single pass: research runs, AI produces structured analysis, and HTML is written in one shot. There's no durable artifact between the AI analysis and the HTML output. This means:

You can't re-render the report (different template, dark mode, layout changes) without re-running the AI
You can't inspect or diff the raw findings before rendering
Debugging requires tracing through HTML, not clean data
The AI and the renderer are entangled — changing the template requires touching the orchestrator
Goal
Split the pipeline into two independent phases:

Phase 1 — Research: Runs AI queries, builds ReportModel, writes it to <Company>_<date>.report.json in the output directory.

Phase 2 — Render: Reads a .report.json, applies it to the HTML template via script, writes <Company>_<date>.html. No AI calls.

New File Artifacts
File	Produced by	Consumed by
Sardine_2026-04-17.report.json	Phase 1 (orchestrator)	Phase 2 (renderer)
Sardine_2026-04-17.html	Phase 2 (renderer)	Browser
The JSON schema is the existing ReportModel type. No new types needed.

CLI Changes
Current:


node dist/src/cli.js → writes .html
New:


node dist/src/cli.js              → writes .report.json (research only)
node dist/src/cli.js --render <file.report.json>  → writes .html from existing JSON
node dist/src/cli.js --full       → research + render in one go (default behavior, convenience)
Scope
In scope:

Orchestrator writes ReportModel as JSON after all AI calls complete
A renderFromJson(jsonPath) function reads the file and calls the existing renderReport()
CLI gains --render flag for standalone re-render
--full (or no flag) chains both phases automatically
Out of scope:

Changing the ReportModel schema
Changing the HTML template or styles
Changing any AI prompts or section logic
A web UI or file watcher
Invariants
Phase 2 (renderReport) makes zero network or AI calls — only reads the JSON and the template files
The JSON file is the single source of truth for the report content; the HTML is always derivable from it
Re-running Phase 2 on the same JSON must produce byte-for-byte identical HTML (deterministic)
Files Affected
File	Change
src/report/orchestrator.ts	Write ReportModel to .report.json after analysis; return jsonPath alongside outputPath
src/cli.ts	Add --render flag; route to renderFromJson(); add --full for combined run
src/render/report-renderer.ts	Extract a renderFromJson(jsonPath, templateDir) entry point that loads JSON + template and calls renderReport()
src/types/index.ts	No changes
references/template.html	No changes