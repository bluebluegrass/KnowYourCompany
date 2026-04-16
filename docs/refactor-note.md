# Refactor Note

Current prompt-only bottlenecks:
- Claude is the only call site and performs retrieval planning, fetch selection, dedupe, analysis, translation, and HTML rendering in one pass.
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
- late translation on final user-facing prose only

Tradeoffs:
- more code and configuration surface
- retrieval quality now depends on the code-managed search/fetch layer
- current multilingual support translates the final summary and section prose late, plus fixed UI labels; evidence normalization across languages is still a follow-up area rather than a finished claim of full multilingual parity
