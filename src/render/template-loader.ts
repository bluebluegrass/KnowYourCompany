import { readFile } from "node:fs/promises";

export async function loadTemplate(templatePath: string, stylesPath: string): Promise<{ template: string; styles: string }> {
  const [template, styles] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(stylesPath, "utf8")
  ]);
  return { template, styles };
}
