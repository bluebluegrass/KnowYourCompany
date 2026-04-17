#!/usr/bin/env node
// Renders a .report.json into a self-contained HTML file using references/template.html.
// Usage: node references/render.js <path-to-report.json>
"use strict";
const fs = require("fs");
const path = require("path");

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node references/render.js <path-to-report.json>");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const dir = path.join(__dirname);
const template = fs.readFileSync(path.join(dir, "template.html"), "utf8");
const styles = fs.readFileSync(path.join(dir, "styles.css"), "utf8");

let html = template.replace(
  /\/\* ── PASTE references\/styles\.css HERE ───────────────────────── \*\//,
  styles.trim()
);

for (const [key, value] of Object.entries(data)) {
  html = html.split(`{{ ${key} }}`).join(value || "");
}

const remaining = html.match(/\{\{[^}]+\}\}/);
if (remaining) {
  console.error(`Error: unfilled placeholder ${remaining[0]}`);
  process.exit(1);
}

const outPath = jsonPath.replace(/\.report\.json$/, ".html");
fs.writeFileSync(outPath, html, "utf8");
console.log(`Saved: ${outPath}`);
