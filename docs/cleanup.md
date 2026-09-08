Refactor this repo toward a simpler architecture.

Goal:

* AI does research and produces structured JSON
* script renders JSON into HTML deterministically

Keep these boundaries:

* `src/cli.ts`
* `src/report/orchestrator.ts`
* `src/model/anthropic-client.ts`
* `src/model/schema.ts`
* `src/model/section-analyzer.ts`
* `src/render/report-renderer.ts`
* `src/render/template-loader.ts`
* `src/render/html-fragments.ts`
* `src/report/artifact-paths.ts`
* `src/types/index.ts`

Main cleanup targets:

* merge tightly coupled retrieval files
* merge tightly coupled evidence-processing files
* consolidate section prompt files into one module or a config-driven approach
* reduce file count and handoff points
* remove dead abstractions from earlier refactors

Strong suggestions:

* merge `search-client.ts` + `fetcher.ts` + maybe `cleaner.ts`
* merge `recency.ts` + `source-normalizer.ts` + `scorer.ts` + `dedupe.ts` + `packet-builder.ts`
* collapse most section prompt files into `src/prompts/sections.ts` or config-driven prompt logic

Rules:

* preserve behavior where reasonable
* prefer fewer, workflow-shaped modules
* avoid over-engineering
* use best engineering judgment when unclear
* do not stop to ask for approval on minor ambiguities
* update tests and remove dead files/imports

At the end, summarize:

* what changed
* what you intentionally kept separate
* what judgment calls you made
