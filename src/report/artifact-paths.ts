import path from "node:path";

export interface ArtifactNames {
  baseName: string;
  htmlFileName: string;
  jsonFileName: string;
}

export function buildArtifactNames(company: string, date: string): ArtifactNames {
  const safeCompany = company.trim().replace(/\s+/g, "_");
  const baseName = `${safeCompany}_KnowYourCompany_${date}`;
  return {
    baseName,
    htmlFileName: `${baseName}.html`,
    jsonFileName: `${baseName}.report.json`
  };
}

export function buildJsonPath(outputDir: string, company: string, date: string): string {
  return path.join(outputDir, buildArtifactNames(company, date).jsonFileName);
}

export function buildHtmlPath(outputDir: string, company: string, date: string): string {
  return path.join(outputDir, buildArtifactNames(company, date).htmlFileName);
}
