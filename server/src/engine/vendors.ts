"use strict";

import type {
  BudgetPlan,
  EventType,
  VendorItem,
  VendorPlan,
} from "@shared/types";
import { VENDOR_TEMPLATES } from "../data/vendors";

/**
 * Build the vendor checklist. Each item's estimated cost is derived from the
 * budget line it maps to, split across the items that share the same line.
 * If no budget plan is provided, costs default to 0 and the UI shows "TBD".
 */
export function buildVendorPlan(
  eventType: EventType,
  budget?: BudgetPlan,
): VendorPlan {
  const templates = VENDOR_TEMPLATES[eventType];
  if (!templates) {
    return { items: [] };
  }

  // Count items per budget key so shared lines split evenly.
  const countPerKey = new Map<string, number>();
  for (const t of templates) {
    countPerKey.set(t.budgetKey, (countPerKey.get(t.budgetKey) ?? 0) + 1);
  }
  const seenPerKey = new Map<string, number>();

  const items: VendorItem[] = templates.map((t) => {
    let estimatedCost = 0;
    if (budget) {
      const line = budget.lines.find((l) => l.key === t.budgetKey);
      if (line) {
        const count = countPerKey.get(t.budgetKey) ?? 1;
        const seen = seenPerKey.get(t.budgetKey) ?? 0;
        // Give the remainder to the first item of each key.
        const base = Math.floor(line.amount / count);
        estimatedCost = seen === 0 ? line.amount - base * (count - 1) : base;
        seenPerKey.set(t.budgetKey, seen + 1);
      }
    }
    return { ...t, estimatedCost };
  });

  return { items };
}
