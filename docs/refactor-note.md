# Refactor Note

Current prompt-only bottlenecks:
- Claude is the only call site and performs retrieval planning, fetch selection, dedupe, analysis, and HTML rendering in one pass.
- Prompt assembly is fully embedded in `KnowYourCompany.md`.
- HTML generation depends on Claude reading and filling `references/template.html`.

Deterministic work moved into code:
- search planning
- recency filtering before broad fetch expansion
- URL normalization and source dedupe
- evidence packet construction
- cache keying and invalidation
- template rendering and placeholder validation
- offline HTML generation

Expected token savings:
- lower per-call context from raw-page text to compact evidence packets
- section-level prompts instead of one monolith
- reuse via cached fetches, packets, and section analyses

Tradeoffs:
- more code and configuration surface
- retrieval quality now depends on the code-managed search/fetch layer
- local-language search support still improves retrieval coverage for selected sections, but the rest of the pipeline remains language-light rather than fully multilingual
