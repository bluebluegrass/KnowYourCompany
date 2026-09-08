# PRD: Dual Claude And Codex Runtime Support

## Goal

Support both execution modes without changing report structure or research logic:

1. If the user runs the tool with Claude Code, keep the current Claude path.
2. If the user runs the tool with Codex, run the Codex CLI path.

In both cases, the output format, section logic, prompt structure, severity rules, JSON schema, and HTML rendering should stay aligned.

---

## Implemented design

The runtime now supports a provider switch.

### Provider: `claude`

- Default when no provider is specified
- Uses the existing Claude Code model client
- Uses Claude Code search and fetch tooling
- Still requires `claude` on `PATH` and `claude auth login`

### Provider: `codex`

- Enabled with `--provider codex` or `KYC_PROVIDER=codex`
- Uses the installed Codex CLI authenticated through `codex login`
- Uses the existing HTTP search and fetch pipeline for retrieval
- Reuses the same analysis prompts, section analyzer, report assembly, and HTML renderer

This means the pipeline logic is shared while the provider-specific adapters are swapped at the edges.

---

## What stays identical

- query planning
- evidence dedupe and scoring
- section prompt construction
- summary prompt construction
- section schema validation
- report JSON shape
- HTML rendering
- file naming convention

The point of the provider split is not to create two report systems. It is to keep one report pipeline with two interchangeable execution backends.

---

## Important nuance

"Content should be the same" is achievable at the workflow level, not as a byte-for-byte guarantee.

What can be held constant:

- same sections
- same severity framework
- same prompt rules
- same report schema
- same renderer

What can still vary:

- search engine result ordering
- page availability over time
- model phrasing and summarization choices

So the correct engineering goal is:

- same logic
- same output structure
- materially equivalent report quality

Not:

- perfectly identical text across providers

---

## Runtime behavior

### Claude run

```bash
node dist/src/cli.js --full --company "Darktrace" --location "Amsterdam" --role "Data Engineer"
```

This uses provider `claude` by default.

### Codex run

```bash
node dist/src/cli.js --provider codex --full --company "Darktrace" --location "Amsterdam" --role "Data Engineer"
```

This uses the Codex CLI-backed model client and the shared retrieval/render pipeline.

---

## Files changed

| File | Purpose |
|---|---|
| `dist/src/cli.js` | Provider selection and runtime checks |
| `dist/src/report/orchestrator.js` | Provider-based dependency wiring |
| `dist/src/model/codex-cli-client.js` | Codex CLI model adapter |
| `dist/src/config/constants.js` | Codex model default |
| `dist/tests/cli.test.js` | Provider and auth tests |
| `dist/tests/codex-cli-client.test.js` | Codex model client tests |

---

## Remaining limitation

The Codex provider currently reuses the generic HTTP search/fetch path instead of a Codex-specific search/fetch SDK.

That is acceptable because the report logic stays shared, but it means Claude and Codex do not retrieve evidence through the exact same upstream toolchain.
