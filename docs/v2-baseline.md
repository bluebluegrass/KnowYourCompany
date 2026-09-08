# v2 Implementation Baseline

Date: 2026-09-06

## Source recovery

The `main` branch is a skill-first distribution and does not track the Node/TypeScript pipeline required by the v2 implementation plan. The implementation source was restored from the repository's local `refactor/main-cleanup` branch:

- `src/`
- `tests/`
- `package.json` and `package-lock.json`
- `tsconfig.json`

No existing skill files, report artifacts, templates, or README content were modified as part of that recovery.

## Build hygiene

The working directory already contained generated files from an older `dist/` build. The former `node --test dist/tests/*.test.js` command executed those stale tests in addition to current source tests. Rather than delete the existing generated files, `scripts/run-tests.mjs` derives the test list from the tracked `tests/*.test.ts` source files after TypeScript compilation.

## Verification command

```bash
npm test
```

Current result: 30 passing tests, 0 failures.

## Known validation boundary

The regression suite uses frozen fixtures and mocked research clients. A live external-research smoke test is intentionally not included in this baseline because it would depend on changing web content and a chosen company target. The v2 renderer, schema, quality gates, candidate matching, actions, and snapshot comparison are covered without a network call.
