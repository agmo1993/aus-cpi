/**
 * Display formatting shared between server and client components.
 */

/** Renders an 'mm-yyyy' key from the query layer as 'June 2026'. */
export function formatMonth(key: string | undefined): string {
  if (!key) return "";
  const [month, year] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a percentage change. No leading '+': CategoryCard adds one itself
 * when the trend is up, and a negative value already carries its sign.
 */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}
