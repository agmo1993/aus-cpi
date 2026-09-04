/**
 * AusCPI chart colors.
 *
 * These are the same five categorical slots defined as CSS custom properties
 * in globals.css, repeated here as literal hex for libraries that cannot
 * resolve a CSS variable (d3 writes them into SVG attributes).
 *
 * The set was validated with the dataviz skill's validate_palette.js against
 * both surfaces. Do not add, reorder, or substitute a slot without re-running
 * it: the order is what keeps green and coral non-adjacent, which is the pair
 * that collides under protanopia.
 */

export const SERIES_LIGHT = [
  "#1E7A4E", // green
  "#9B5FC0", // violet
  "#E0684F", // coral
  "#2A6FA8", // blue
  "#A8761F", // ochre
] as const;

export const SERIES_DARK = [
  "#3D9E6B",
  "#9E77C9",
  "#E06B52",
  "#5A9BD4",
  "#B4862C",
] as const;

/** How many series can be drawn before the rest must fold into "Other". */
export const MAX_SERIES = SERIES_LIGHT.length;

/** Neutral used for the folded "Other" series, in either mode. */
export const SERIES_OTHER = "#8A918C";

/**
 * Color for the series at `index`.
 *
 * Deliberately does NOT cycle. Reusing slot 1 for a sixth series makes two
 * different categories share a color, which silently misreads the chart.
 * Past the fifth slot the caller gets the neutral and should have folded the
 * tail into a single "Other" series or split into small multiples.
 */
export function getSeriesColor(index: number, mode: "light" | "dark" = "light"): string {
  const ramp = mode === "dark" ? SERIES_DARK : SERIES_LIGHT;
  return ramp[index] ?? SERIES_OTHER;
}
