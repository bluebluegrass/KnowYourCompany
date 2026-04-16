export function normalizeUrl(input: string): string {
  const url = new URL(input);
  const paramsToDrop = [...url.searchParams.keys()].filter(
    (key) => key.startsWith("utm_") || key === "ref" || key === "source"
  );
  for (const key of paramsToDrop) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  return url.toString();
}
