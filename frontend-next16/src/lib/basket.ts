/**
 * Rebuilding a CPI from part of the basket.
 *
 * Within a link period a parent index is the weighted average of its
 * children's price relatives, carried from the parent's own level at the link:
 *
 *   I(t) = I(link) x SUM_i [ (w_i / SUM w) x I_i(t) / I_i(link) ]
 *
 * Two things make it work, both of which apply just as much to a personal
 * basket as to the published one:
 *
 *  - The weights are renormalised. `weight` is a share of the All groups CPI,
 *    not of whatever subset is selected, so the sum over the selected items is
 *    the denominator. Dropping tobacco does not shrink the index; it
 *    redistributes tobacco's 1.86% across everything that is left.
 *  - Official aggregation cannot cross a link. The 2025 pattern is
 *    price-updated to December 2024. The page still offers a longer reading:
 *    the same (current) weights applied to class indexes as far back as every
 *    class is published. That is "if I had always spent like this", not an
 *    ABS chain. `values[0]` is that earliest complete month.
 *
 * Verified against the published All groups CPI in
 * backend/docs/cpi-index-from-weights.md: rebuilding from all 87 expenditure
 * classes reproduces it to within 0.01 index points for every city.
 */

import type {
  BasketContribution,
  BasketInputs,
  BasketNode,
  BasketResult,
  WeightRow,
} from '@/types/basket';

/** The root of the hierarchy, and the label of the published headline index. */
const ROOT_ITEM = 'All groups CPI';

/**
 * Builds the selectable hierarchy from the weighting pattern.
 *
 * The structure is the same for every city, so it is read off one of them and
 * the per-city weights are looked up separately.
 *
 * A branch with a single child of the same name is collapsed away: the ABS
 * publishes Communication as both a group and a sub-group, and Rents as both
 * a sub-group and an expenditure class, because a level of the hierarchy has
 * to exist even where nothing divides it. Keeping both would show the reader
 * the same thing twice with the same weight.
 */
export function buildTree(rows: WeightRow[]): BasketNode[] {
  const city = rows.some((row) => row.city === 'Australia')
    ? 'Australia'
    : rows[0]?.city;
  const local = rows.filter((row) => row.city === city);

  const weightOf = new Map(local.map((row) => [`${row.item_level}|${row.item}`, row.weight]));

  // Keyed on the parent's name *and* the child's level, not on the name
  // alone. Where a label repeats down the hierarchy the rows below it name
  // that label as their parent from two levels at once: everything under
  // Communication, both the sub-group and its two expenditure classes, says
  // parent_item = 'Communication'.
  const childrenOf = new Map<string, WeightRow[]>();
  for (const row of local) {
    if (row.parent_item === null) continue;
    const key = `${row.parent_item}|${row.item_level}`;
    const siblings = childrenOf.get(key) ?? [];
    siblings.push(row);
    childrenOf.set(key, siblings);
  }

  const below: Record<string, string> = {
    group: 'sub-group',
    'sub-group': 'expenditure class',
  };

  const build = (row: WeightRow): BasketNode => {
    const kids = (childrenOf.get(`${row.item}|${below[row.item_level]}`) ?? [])
      .map(build)
      .sort((a, b) => weight(b, weightOf) - weight(a, weightOf));

    const collapsed =
      kids.length === 1 && kids[0].item === row.item ? kids[0].children : kids;

    return {
      item: row.item,
      level: row.item_level,
      children: collapsed,
      leaves: collapsed.length === 0
        ? [row.item]
        : collapsed.flatMap((kid) => kid.leaves),
    };
  };

  return local
    .filter((row) => row.item_level === 'group')
    .map(build)
    .sort((a, b) => weight(b, weightOf) - weight(a, weightOf));
}

/** A node's own weight, used only to order siblings largest first. */
function weight(node: BasketNode, weights: Map<string, number>): number {
  return weights.get(`${node.level}|${node.item}`) ?? 0;
}

/** Every expenditure class in the hierarchy, in tree order. */
export function allLeaves(tree: BasketNode[]): string[] {
  return tree.flatMap((node) => node.leaves);
}

/** The group each expenditure class belongs to, for labelling and grouping. */
export function leafGroups(tree: BasketNode[]): Record<string, string> {
  const groups: Record<string, string> = {};
  for (const group of tree) {
    for (const leaf of group.leaves) groups[leaf] = group.item;
  }
  return groups;
}

/**
 * Rebuilds the index for a selection of expenditure classes.
 *
 * Anchored to the city's published All groups CPI at the link period rather
 * than rebased to 100, so the result sits on the same scale as the published
 * index and the two can be read off one axis.
 *
 * Returns nulls-free empty output for an empty selection; the caller shows an
 * empty state rather than a flat line.
 */
export function computeBasket(
  inputs: BasketInputs,
  city: string,
  selected: Iterable<string>
): BasketResult {
  const weights = inputs.weights[city] ?? {};
  const series = inputs.series[city] ?? {};
  const anchor = inputs.headline[city]?.[0] ?? 100;

  const items = [...selected].filter((item) => series[item] && weights[item] > 0);
  const coverage = items.reduce((sum, item) => sum + weights[item], 0);

  if (items.length === 0 || coverage === 0) {
    return { index: [], coverage: 0, shares: {} };
  }

  const shares: Record<string, number> = {};
  for (const item of items) shares[item] = (weights[item] / coverage) * 100;

  const index = inputs.months.map((_, t) => {
    let relative = 0;
    for (const item of items) {
      const values = series[item];
      relative += weights[item] * (values[t] / values[0]);
    }
    return (anchor * relative) / coverage;
  });

  return { index, coverage, shares };
}

/**
 * Each selected item's share of the basket's change between two months.
 *
 * The contributions sum to the basket's percentage change, exactly: the index
 * is linear in the price relatives, so the change decomposes without residual.
 * An item shows up large here either because it moved a lot or because it is a
 * big share of the basket, which is the whole point of showing both columns.
 */
export function computeContributions(
  inputs: BasketInputs,
  city: string,
  result: BasketResult,
  from: number,
  to: number
): BasketContribution[] {
  const series = inputs.series[city] ?? {};
  const anchor = inputs.headline[city]?.[0] ?? 100;
  const base = result.index[from];
  if (!base) return [];

  const groups = leafGroups(inputs.tree);

  return Object.entries(result.shares)
    .map(([item, share]) => {
      const values = series[item];
      return {
        item,
        group: groups[item] ?? '',
        share,
        itemChange: (values[to] / values[from] - 1) * 100,
        contribution:
          ((anchor * (share / 100) * (values[to] - values[from])) / values[0] / base) * 100,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

/** Percentage change of a series between two positions, or null if unavailable. */
export function change(series: number[], from: number, to: number): number | null {
  if (from < 0 || to < 0 || from >= series.length || to >= series.length) return null;
  const start = series[from];
  if (!start) return null;
  return (series[to] / start - 1) * 100;
}

/** The share of each group in a selection, largest first, for the composition view. */
export function groupShares(
  tree: BasketNode[],
  shares: Record<string, number>
): Array<{ group: string; share: number }> {
  return tree
    .map((group) => ({
      group: group.item,
      share: group.leaves.reduce((sum, leaf) => sum + (shares[leaf] ?? 0), 0),
    }))
    .filter((entry) => entry.share > 0)
    .sort((a, b) => b.share - a.share);
}

/**
 * A selection as a bitmask over the basket, for a share link or local storage.
 *
 * Bit order is the alphabetical item list, not the order the tree happens to
 * be sorted in: the tree is ordered by weight, which changes with every
 * re-weighting, and a link that quietly decodes to different items after the
 * next pattern is loaded would be worse than one that stops working. The item
 * count is carried in front for the same reason — a pattern with a different
 * number of classes fails the check and the reader gets the default basket.
 */
export function encodeSelection(selected: Iterable<string>, leaves: string[]): string {
  const set = selected instanceof Set ? selected : new Set(selected);
  const order = [...leaves].sort();
  const bytes = new Uint8Array(Math.ceil(order.length / 8));

  order.forEach((leaf, i) => {
    if (set.has(leaf)) bytes[i >> 3] |= 1 << (i & 7);
  });

  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${order.length}.${base64}`;
}

/** Reads back `encodeSelection`, or null if it does not fit the loaded pattern. */
export function decodeSelection(
  encoded: string | null | undefined,
  leaves: string[]
): string[] | null {
  if (!encoded) return null;

  const [count, payload] = encoded.split('.');
  const order = [...leaves].sort();
  if (Number(count) !== order.length || !payload) return null;

  try {
    const binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // charCodeAt past the end is NaN, and NaN & mask is 0, so a truncated
    // payload decodes to the items it does carry rather than throwing.
    return order.filter((_, i) => (binary.charCodeAt(i >> 3) & (1 << (i & 7))) !== 0);
  } catch {
    return null;
  }
}

/** Renders a 'YYYY-MM' month key as 'Jun 2026'. */
export function formatBasketMonth(month: string | undefined): string {
  if (!month) return '';
  const [year, index] = month.split('-');
  return new Date(Number(year), Number(index) - 1).toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
  });
}

export { ROOT_ITEM };
