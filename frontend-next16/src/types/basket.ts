/**
 * Personal basket types
 *
 * The shapes the /basket page passes from the server (weights and index
 * levels, straight out of the database) to the client, where the aggregation
 * is re-run on every selection change.
 */

/** A level of the ABS hierarchy, as stored in cpi_weights_by_city.item_level. */
export type ItemLevel = 'all groups' | 'group' | 'sub-group' | 'expenditure class';

/** One row of the weighting pattern, for one item and one city. */
export interface WeightRow {
  item: string;
  city: string;
  item_level: ItemLevel;
  parent_item: string | null;
  weight: number;
}

/**
 * A node of the selectable hierarchy. Leaves are expenditure classes, the
 * only level the basket aggregates over: selecting a parent selects its
 * leaves, so no item is ever counted twice.
 */
export interface BasketNode {
  /** The ABS item label, unique within its level and the id used throughout. */
  item: string;
  level: ItemLevel;
  children: BasketNode[];
  /** Expenditure classes under this node, itself if it is a leaf. */
  leaves: string[];
}

/**
 * Everything the client needs to rebuild the index for any city and any
 * selection, fetched once on the server.
 *
 * Index levels are kept per city as a flat array aligned to `months`. The
 * first month is the earliest date every expenditure class is published;
 * `values[0]` is the base of the price relative. The ABS link period may sit
 * later in the array.
 */
export interface BasketInputs {
  /** The ABS weighting pattern year, e.g. 2025. */
  pattern: number;
  /** Period the weights are price-updated to, 'YYYY-MM'. The base of everything. */
  linkPeriod: string;
  /** Months from the earliest complete class panel to the latest published, 'YYYY-MM'. */
  months: string[];
  cities: string[];
  /** The hierarchy, identical across cities. */
  tree: BasketNode[];
  /** weights[city][item] as a percentage of that city's All groups CPI. */
  weights: Record<string, Record<string, number>>;
  /** series[city][expenditure class] aligned to `months`. */
  series: Record<string, Record<string, number[]>>;
  /** The published All groups CPI per city, aligned to `months`. */
  headline: Record<string, number[]>;
}

/** An item's share of the basket and what it did over the chosen window. */
export interface BasketContribution {
  item: string;
  group: string;
  /** Share of the selected basket, renormalised to sum to 100. */
  share: number;
  /** The item's own price change over the window, as a percentage. */
  itemChange: number;
  /** Percentage points of the basket's change owed to this item. */
  contribution: number;
}

/** A rebuilt index and the changes read off it. */
export interface BasketResult {
  /** The index, aligned to `months` and anchored to the published All groups. */
  index: number[];
  /** Sum of the selected weights: the share of the official basket covered. */
  coverage: number;
  /** Renormalised weight per selected expenditure class, summing to 100. */
  shares: Record<string, number>;
}
