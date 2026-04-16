# KnowYourCompany

This command is now a thin launcher for the code-managed pipeline.

## Collect Inputs

Ask the user for:

1. Company name
2. Office location, optional
3. Job role, optional
4. Report language, optional, default English

## Run the pipeline

After collecting the inputs, run the local CLI instead of doing the full research and rendering inside Claude:

```bash
npm run report -- --company "{COMPANY}" --location "{LOCATION}" --role "{ROLE}" --language "{OUTPUT_LANG}"
```

If an optional field is empty, omit that flag.

## What the CLI now handles

- search planning
- recency-aware retrieval
- page fetch and cleaning
- evidence dedupe and ranking
- compact evidence packet creation
- section-level model analysis
- final summary synthesis
- translation at the final user-facing stage
- HTML template rendering from `references/template.html`
- inline CSS from `references/styles.css`
- placeholder validation

## Final response to the user

After the command completes, report:

- the saved HTML filename
- the risk snapshot from the generated output
- that the report is self-contained and can be opened offline
