"use client";

/**
 * The basket selector: the ABS hierarchy with a checkbox on every node.
 *
 * Selection is only ever stored at the leaves — expenditure classes, the
 * level the aggregation runs at. A group's checkbox is a shorthand for its
 * leaves and reads back their state, which is what keeps a parent and its
 * children from both being counted.
 */

import React, { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BasketNode } from "@/types/basket";

interface CategoryTreeProps {
  tree: BasketNode[];
  /** Official weight per item, as a percentage of the All groups CPI. */
  weights: Record<string, number>;
  selected: Set<string>;
  onChange: (leaves: string[], select: boolean) => void;
}

type CheckState = "checked" | "unchecked" | "mixed";

function stateOf(leaves: string[], selected: Set<string>): CheckState {
  let hits = 0;
  for (const leaf of leaves) if (selected.has(leaf)) hits += 1;
  if (hits === 0) return "unchecked";
  return hits === leaves.length ? "checked" : "mixed";
}

/**
 * A checkbox with a third state, for a branch whose leaves are only partly
 * selected. Built on a button rather than an <input>, which has no mixed
 * state to render and would need the same aria-checked override anyway.
 */
const Check: React.FC<{ state: CheckState; label: string; onClick: () => void }> = ({
  state,
  label,
  onClick,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={state === "mixed" ? "mixed" : state === "checked"}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      state === "unchecked"
        ? "border-input bg-background hover:border-primary/60"
        : "border-primary bg-primary text-primary-foreground"
    )}
  >
    {state === "checked" && (
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
        <path
          d="M2.5 6.2 4.8 8.5 9.5 3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
    {state === "mixed" && <span className="h-0.5 w-2 rounded-full bg-current" />}
  </button>
);

const CategoryTree: React.FC<CategoryTreeProps> = ({
  tree,
  weights,
  selected,
  onChange,
}) => {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  // While searching, every branch that survives the filter is open: a hit
  // three levels down is invisible otherwise, and having to expand to find
  // what you just searched for defeats the search.
  const matches = useMemo(() => {
    if (!query) return null;
    const keep = new Set<string>();

    const walk = (node: BasketNode, ancestorHit: boolean): boolean => {
      const self = node.item.toLowerCase().includes(query);
      // A branch whose own name matches keeps all of its children, so
      // searching 'housing' shows the group rather than an empty group.
      const hit = node.children.reduce<boolean>(
        (found, child) => walk(child, ancestorHit || self) || found,
        false
      );
      if (self || hit || ancestorHit) keep.add(node.item);
      return self || hit;
    };

    for (const group of tree) walk(group, false);
    return keep;
  }, [query, tree]);

  const isOpen = (item: string) => (query ? true : open.has(item));

  const toggleOpen = (item: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });

  const renderNode = (node: BasketNode, depth: number): React.ReactNode => {
    if (matches && !matches.has(node.item)) return null;

    const state = stateOf(node.leaves, selected);
    const weight = weights[node.item];
    const branch = node.children.length > 0;
    const expanded = isOpen(node.item);

    return (
      <li key={`${node.level}-${node.item}`}>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors hover:bg-accent/50",
            depth === 0 && "font-medium"
          )}
          style={{ paddingLeft: `${depth * 18 + 4}px` }}
        >
          {branch ? (
            <button
              type="button"
              onClick={() => toggleOpen(node.item)}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${node.item}`}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
                strokeWidth={2}
              />
            </button>
          ) : (
            <span className="w-[19px]" aria-hidden="true" />
          )}

          <Check
            state={state}
            label={node.item}
            onClick={() => onChange(node.leaves, state !== "checked")}
          />

          <button
            type="button"
            onClick={() => onChange(node.leaves, state !== "checked")}
            className="flex-1 truncate text-left text-sm"
            title={node.item}
          >
            {node.item}
          </button>

          {weight !== undefined && (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {weight.toFixed(2)}%
            </span>
          )}
        </div>

        {branch && expanded && (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search the basket"
          aria-label="Search the basket"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-[620px] overflow-y-auto pr-1">
        {matches && matches.size === 0 ? (
          <p className="px-1 py-6 text-sm text-muted-foreground">
            Nothing in the basket matches &lsquo;{search}&rsquo;.
          </p>
        ) : (
          <ul>{tree.map((group) => renderNode(group, 0))}</ul>
        )}
      </div>
    </div>
  );
};

export default CategoryTree;
