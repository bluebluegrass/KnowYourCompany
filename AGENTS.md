# KnowYourCompany Repo Guidance

For company background-check workflows in this repo, use the `know-your-company` skill.

- The canonical Codex skill is at [`.agents/skills/know-your-company/SKILL.md`](./.agents/skills/know-your-company/SKILL.md)
- The Claude Code mirror is at [`.claude/skills/know-your-company/SKILL.md`](./.claude/skills/know-your-company/SKILL.md)
- [`references/render.js`](./references/render.js) is the canonical renderer
- [`references/template.html`](./references/template.html) and [`references/styles.css`](./references/styles.css) are presentation assets

Do not hand-write final HTML for the standard workflow unless the user explicitly asks for that. Write the `.report.json` first, then render with the local script.
