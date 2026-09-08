# Refactor Task List: Two-Phase Pipeline

## Goal

- [x] Split the current one-shot pipeline into two independent phases:
  - [x] Phase 1: Research -> `ReportModel` -> `.report.json`
  - [x] Phase 2: `.report.json` -> HTML render
- [x] Preserve the existing `ReportModel` schema
- [x] Keep the current HTML template and styles unchanged

## Phase 1: Research Output

- [x] Refactor `src/report/orchestrator.ts` so `runReport()` becomes research-only
- [x] Keep all existing search, fetch, evidence, and AI analysis behavior unchanged
- [x] Continue building the same `ReportModel`
- [x] Write the final report to `<Company>_KnowYourCompany_<date>.report.json`
- [x] Return `jsonPath` from the orchestrator result
- [x] Stop writing HTML directly from the orchestrator

## Phase 2: Render From JSON

- [x] Add a `renderFromJson(jsonPath, templateDir?)` entry point in `src/render/report-renderer.ts`
- [x] Read and parse an existing `.report.json` file
- [x] Load `references/template.html` and `references/styles.css`
- [x] Reuse the existing `renderReport()` function for HTML generation
- [x] Write `<Company>_KnowYourCompany_<date>.html`
- [x] Ensure render-only mode performs zero AI or network calls

## CLI Changes

- [x] Update `src/cli.ts` to support research-only mode as the default
- [x] Add `--render <file.report.json>` for standalone rendering
- [x] Add `--full` to run research and then render immediately
- [x] Skip company/location/role prompts when `--render` is used
- [x] Print the correct saved artifact paths for each mode

## Shared Utilities

- [x] Extract or centralize artifact naming logic so JSON and HTML filenames stay consistent
- [x] Ensure output paths are deterministic across modes
- [x] Decide whether render output defaults to the JSON file's directory or an explicit output directory

## Validation

- [ ] Confirm `node dist/src/cli.js` writes only `.report.json`
- [x] Confirm `node dist/src/cli.js --render path/to/file.report.json` writes only `.html`
- [ ] Confirm `node dist/src/cli.js --full` writes both artifacts
- [x] Confirm repeated renders from the same JSON produce identical HTML
- [x] Confirm no template placeholders remain after rendering

## Testing

- [x] Add or update tests for CLI argument handling
- [x] Add or update tests for render-from-JSON behavior
- [x] Add or update tests for deterministic HTML output from fixture JSON
- [x] Add or update tests to verify the orchestrator no longer writes HTML in research-only mode
- [ ] Run a manual smoke test for all three CLI flows if automated coverage is limited

## Out of Scope

- [x] Do not change `ReportModel`
- [x] Do not change prompts or section logic
- [x] Do not change `references/template.html`
- [x] Do not change styles or visual layout
- [x] Do not add a watcher or web UI
