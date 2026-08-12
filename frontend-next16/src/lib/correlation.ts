/**
 * Correlation matrix helpers.
 *
 * Kept free of React so the colour and contrast rules can be exercised
 * directly.
 */

import type { CorrelationData } from "@/types/cpi";

/**
 * Diverging ramp for Pearson's r.
 *
 * Correlation is polarity around a meaningful zero, so it gets two hues and a
 * neutral midpoint rather than a single light-to-dark ramp: the reader has to
 * see the sign before the strength. The poles are the same coral and green
 * used for falling and rising prices elsewhere.
 */
const RAMP = {
  light: { negative: "#E0684F", neutral: "#EDF0EE", positive: "#1E7A4E" },
  dark: { negative: "#E06B52", neutral: "#242A27", positive: "#3D9E6B" },
} as const;

/** Ink colours picked per cell, so the value stays readable on any fill. */
const INK = { onLight: "#0F1412", onDark: "#F7FAF8" } as const;

export type Scheme = keyof typeof RAMP;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Fill colour for a correlation coefficient.
 *
 * The domain is fixed at [-1, 1] rather than fitted to the values on screen,
 * so a shade means the same strength no matter which series are selected.
 * A scale refitted per selection would repaint every cell whenever a series
 * is added, which reads as the data changing when it has not.
 */
export function correlationColor(r: number, scheme: Scheme = "light"): string {
  const ramp = RAMP[scheme];
  const clamped = Math.max(-1, Math.min(1, r));
  const pole = hexToRgb(clamped < 0 ? ramp.negative : ramp.positive);
  const neutral = hexToRgb(ramp.neutral);
  const t = Math.abs(clamped);

  return ensureReadable(
    rgbToHex([
      neutral[0] + (pole[0] - neutral[0]) * t,
      neutral[1] + (pole[1] - neutral[1]) * t,
      neutral[2] + (pole[2] - neutral[2]) * t,
    ])
  );
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Small text, so cells are held to the WCAG AA body threshold. */
const MIN_CONTRAST = 4.5;

/**
 * Ink for a cell, chosen by measured contrast rather than a lightness guess.
 * Every cell prints its coefficient, so the number has to stay legible from
 * the palest neutral through to a fully saturated pole.
 */
export function inkFor(background: string): string {
  return contrast(background, INK.onLight) >= contrast(background, INK.onDark)
    ? INK.onLight
    : INK.onDark;
}

/**
 * Nudges a fill until its text clears AA.
 *
 * Around |r| = 0.8 the ramp passes through a mid luminance where neither ink
 * reaches 4.5:1 against the raw interpolated colour, bottoming out near 4.2.
 * Pushing the fill a little further from mid, in the direction the chosen ink
 * already favours, fixes it while keeping the hue and the ordering: darker
 * cells stay darker. The shift is small enough not to disturb the reading, and
 * the legend runs through the same function so the swatches match the cells.
 */
function ensureReadable(background: string): string {
  const ink = inkFor(background);
  const towardWhite = ink === INK.onLight;
  const [tr, tg, tb] = towardWhite ? [255, 255, 255] : [0, 0, 0];

  let [r, g, b] = hexToRgb(background);
  let current = background;

  for (let step = 0; step < 40; step += 1) {
    if (contrast(current, ink) >= MIN_CONTRAST) break;
    r += (tr - r) * 0.04;
    g += (tg - g) * 0.04;
    b += (tb - b) * 0.04;
    current = rgbToHex([r, g, b]);
  }

  return current;
}

/**
 * Plain-language reading of |r|. Shown alongside the number so the matrix is
 * interpretable without knowing the convention for Pearson's r.
 */
export function correlationStrength(r: number): string {
  const magnitude = Math.abs(r);
  if (magnitude >= 0.9) return "very strong";
  if (magnitude >= 0.7) return "strong";
  if (magnitude >= 0.5) return "moderate";
  if (magnitude >= 0.3) return "weak";
  return "negligible";
}

/**
 * Expands the pair list into a full square matrix.
 *
 * The API sends each unordered pair once. A matrix needs both triangles plus
 * the diagonal, where a series correlates with itself at exactly 1.
 * `null` marks a pair the API dropped, which happens when a coefficient came
 * back undefined; those cells render blank rather than as a fabricated zero.
 */
export function buildMatrix(
  pairs: CorrelationData[],
  size: number
): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => (row === col ? 1 : null))
  );

  for (const pair of pairs) {
    const { indexX, indexY, corr } = pair;
    if (
      indexX == null ||
      indexY == null ||
      indexX >= size ||
      indexY >= size ||
      indexX < 0 ||
      indexY < 0
    ) {
      continue;
    }
    matrix[indexY][indexX] = corr;
    matrix[indexX][indexY] = corr;
  }

  return matrix;
}
