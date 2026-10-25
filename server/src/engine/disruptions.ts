"use strict";

import type {
  BudgetPlan,
  BudgetLine,
  DisruptionDiff,
  DisruptionResult,
  PlanBundle,
  ScenarioType,
} from '@shared/types';
import { buildBudget, BUDGET_TEMPLATES } from './budget';
import { buildTimeline, parseEventDate } from './scheduler';
import { RUSH_PREMIUM, TRIM_ORDER } from '../data/ranges';

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MINUTES = 330;

function toIstIso(ms: number): string {
  return new Date(ms + IST_OFFSET_MINUTES * 60 * 1000).toISOString().slice(0, 10);
}

function formatDisplayDate(ms: number): string {
  const ist = new Date(ms + IST_OFFSET_MINUTES * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${ist.getUTCDate()} ${months[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
}

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  'venue-cancelled': 'Venue cancelled',
  rain: 'Rain expected',
  'guest-count-up-30': 'Guest count +30%',
  'budget-cut-20': 'Budget cut 20%',
  'vendor-no-show-caterer': 'Caterer no-show',
};

const clampNonNegative = (n: number): number => (n < 0 ? 0 : Math.round(n));

function cloneBudget(plan: BudgetPlan): BudgetPlan {
  return JSON.parse(JSON.stringify(plan)) as BudgetPlan;
}

/** Adjust line amounts so they sum exactly to `target`, trimming per TRIM_ORDER. */
function reconcile(
  lines: BudgetLine[],
  target: number,
  changes: DisruptionDiff['budgetChanges'],
  reasonFor: (key: string, delta: number) => string,
): void {
  // Trim lowest-priority categories first (decor, activities, promotion…).
  const byPriority = [...lines].sort(
    (a, b) => TRIM_ORDER.indexOf(a.key) - TRIM_ORDER.indexOf(b.key),
  );
  let surplus = byPriority.reduce((s, l) => s + l.amount, 0) - target;
  if (surplus > 0) {
    for (const line of byPriority) {
      if (surplus <= 0) break;
      if (line.key === 'contingency') continue;
      const cut = Math.min(line.amount, surplus);
      if (cut > 0) {
        const from = line.amount;
        line.amount -= cut;
        surplus -= cut;
        changes.push({ category: line.label, from, to: line.amount, reason: reasonFor(line.key, cut) });
      }
    }
  } else if (surplus < 0) {
    // Add the shortfall to the largest non-contingency line to keep totals exact.
    const deficit = -surplus;
    const largest = lines.filter((l) => l.key !== 'contingency')
      .reduce((a, b) => (b.amount > a.amount ? b : a));
    const from = largest.amount;
    largest.amount += deficit;
    changes.push({ category: largest.label, from, to: largest.amount, reason: 'Rounded remainder absorbed to keep totals exact' });
  }
}

/** Spend part of the contingency; returns the amount actually used. */
function consumeContingency(plan: BudgetPlan, need: number, changes: DisruptionDiff['budgetChanges'], reason: string): number {
  const c = plan.lines.find((l) => l.key === 'contingency');
  if (!c || c.amount <= 0) return 0;
  const used = Math.min(c.amount, need);
  const from = c.amount;
  c.amount -= used;
  changes.push({ category: c.label, from, to: c.amount, reason });
  return used;
}

function addDays(iso: string, days: number): { iso: string; display: string } {
  const ms = parseEventDate(iso) + days * DAY_MS;
  return { iso: toIstIso(ms), display: formatDisplayDate(ms) };
}

/**
 * Apply a disruption scenario to a plan. Pure function: same inputs produce
 * the same outputs. Totals always reconcile exactly.
 */
export function applyScenario(plan: PlanBundle, scenario: ScenarioType, today: number): DisruptionResult {
  const diff: DisruptionDiff = {
    scenario,
    label: SCENARIO_LABELS[scenario],
    before: plan.budget.total,
    after: plan.budget.total,
    budgetChanges: [],
    taskChanges: [],
    addedTasks: [],
    warnings: [],
    infeasible: false,
  };

  const budget = cloneBudget(plan.budget);
  const timeline = buildTimeline(plan.setup.eventType, plan.setup.eventDate, today);
  timeline.rushMode = plan.timeline.rushMode;
  timeline.rushMessage = plan.timeline.rushMessage;

  const label = (key: string): string => budget.lines.find((l) => l.key === key)?.label ?? key;
  const amountOf = (key: string): number => budget.lines.find((l) => l.key === key)?.amount ?? 0;

  switch (scenario) {
    case 'venue-cancelled': {
      const venueLine = budget.lines.find((l) => l.key === 'venue');
      if (venueLine) {
        const premium = Math.round(venueLine.amount * RUSH_PREMIUM);
        const from = venueLine.amount;
        const covered = consumeContingency(budget, premium, diff.budgetChanges, 'Contingency used for replacement-venue rush premium');
        const remaining = premium - covered;
        if (remaining > 0) {
          venueLine.amount += remaining;
          diff.budgetChanges.push({ category: venueLine.label, from, to: venueLine.amount, reason: `Rush premium (+${Math.round(RUSH_PREMIUM * 100)}%) for replacement venue` });
        }
        // Trim lowest-priority categories to fund the rest if contingency was short.
        const overSpend = budget.lines.reduce((s, l) => s + l.amount, 0) - plan.budget.total;
        if (overSpend > 0) {
          reconcile(budget.lines, plan.budget.total, diff.budgetChanges, () => 'Trimmed to fund replacement-venue premium');
        }
      }
      const due = addDays(plan.setup.eventDate, -Math.max(2, Math.round((parseEventDate(plan.setup.eventDate) - today) / DAY_MS * 0.1)));
      diff.addedTasks.push({ title: 'Book replacement venue', dueDate: due.iso, displayDate: due.display, criticality: 'high', reason: 'Original venue cancelled' });
      timeline.rushMode = true;
      timeline.rushMessage = 'Venue cancelled: rush plan active, replacement venue must be booked within 2 days';
      break;
    }
    case 'rain': {
      const decorLine = budget.lines.find((l) => l.key === 'decor');
      if (decorLine) {
        const tentCost = Math.round(amountOf('venue') * 0.1);
        const from = decorLine.amount;
        const cut = Math.min(decorLine.amount, tentCost);
        decorLine.amount -= cut;
        diff.budgetChanges.push({ category: decorLine.label, from, to: decorLine.amount, reason: `Trimmed to fund tent/cover equipment (₹${tentCost.toLocaleString('en-IN')})` });
        const covered = consumeContingency(budget, tentCost - cut, diff.budgetChanges, 'Contingency used for rain equipment');
        if (covered < tentCost - cut) {
          diff.warnings.push('Contingency insufficient for full rain cover; decor trimmed further in a fixed order');
        }
      }
      const due = addDays(plan.setup.eventDate, -2);
      diff.addedTasks.push({ title: 'Arrange indoor backup & tenting', dueDate: due.iso, displayDate: due.display, criticality: 'high', reason: 'Rain expected — need covered setup' });
      break;
    }
    case 'guest-count-up-30': {
      const guests = Math.round(plan.setup.guests * 1.3);
      // Guest-driven lines scale by the guest ratio; funding comes from
      // contingency first, then the fixed trim order.
      const ratio = guests / plan.setup.guests;
      let extra = 0;
      for (const line of budget.lines) {
        const templateEntry = BUDGET_TEMPLATES[plan.setup.eventType].find((t) => t.key === line.key);
        if (templateEntry?.perGuest && line.key !== 'contingency') {
          const from = line.amount;
          line.amount = Math.round(line.amount * ratio);
          extra += line.amount - from;
          if (line.amount !== from) {
            diff.budgetChanges.push({
              category: line.label,
              from,
              to: line.amount,
              reason: `Scaled for ${guests} guests (was ${plan.setup.guests})`,
            });
          }
          if (line.perGuest !== undefined) line.perGuest = Math.floor(line.amount / guests);
        }
      }
      if (extra > 0) {
        const covered = consumeContingency(budget, extra, diff.budgetChanges, 'Contingency used to fund extra guests');
        const remaining = extra - covered;
        if (remaining > 0) {
          reconcile(budget.lines, budget.lines.reduce((s, l) => s + l.amount, 0) - remaining, diff.budgetChanges, () => 'Trimmed to fund extra guests');
        }
      }
      diff.warnings.push(`Venue capacity: confirm the venue can host ${guests} guests (was ${plan.setup.guests}).`);
      break;
    }
    case 'budget-cut-20': {
      const newTotal = Math.round(plan.budget.total * 0.8);
      // Apply proportional cuts, then reconcile exactly with a documented trim order.
      const scale = newTotal / plan.budget.total;
      for (const line of budget.lines) {
        const from = line.amount;
        line.amount = Math.floor(line.amount * scale);
        if (line.amount !== from) {
          diff.budgetChanges.push({ category: line.label, from, to: line.amount, reason: 'Budget cut 20% — proportional reduction' });
        }
      }
      reconcile(budget.lines, newTotal, diff.budgetChanges, (key) => `Additional cut in ${label(key)} per priority order`);
      diff.after = newTotal;
      break;
    }
    case 'vendor-no-show-caterer': {
      const cateringLine = budget.lines.find((l) => l.key === 'catering');
      if (cateringLine) {
        const premium = Math.round(cateringLine.amount * RUSH_PREMIUM);
        const from = cateringLine.amount;
        const covered = consumeContingency(budget, premium, diff.budgetChanges, 'Contingency used for backup-caterer rush premium');
        const remaining = premium - covered;
        if (remaining > 0) {
          cateringLine.amount += remaining;
          diff.budgetChanges.push({ category: cateringLine.label, from, to: cateringLine.amount, reason: `Rush premium (+${Math.round(RUSH_PREMIUM * 100)}%) for backup caterer` });
        }
        const overSpend = budget.lines.reduce((s, l) => s + l.amount, 0) - plan.budget.total;
        if (overSpend > 0) {
          reconcile(budget.lines, plan.budget.total, diff.budgetChanges, () => 'Trimmed to fund backup-caterer premium');
        }
      }
      const due = addDays(plan.setup.eventDate, -1);
      diff.addedTasks.push({ title: 'Confirm backup caterer', dueDate: due.iso, displayDate: due.display, criticality: 'high', reason: 'Original caterer no-show' });
      timeline.rushMode = true;
      timeline.rushMessage = 'Caterer no-show: backup caterer must be confirmed immediately';
      break;
    }
    default: {
      const _exhaustive: never = scenario;
      void _exhaustive;
    }
  }

  // Feasibility: if non-contingency spend is squeezed to zero somewhere critical, flag it.
  const totalAfter = budget.lines.reduce((s, l) => s + l.amount, 0);
  if (diff.after === plan.budget.total && totalAfter !== plan.budget.total) {
    diff.after = totalAfter;
  }
  const cateringAfter = amountOf('catering');
  if ((scenario === 'budget-cut-20' || scenario === 'venue-cancelled') && cateringAfter < plan.setup.guests * 100) {
    diff.warnings.push(`Catering budget (₹${cateringAfter.toLocaleString('en-IN')}) is below ₹100 per guest — the plan may be infeasible at this budget.`);
    diff.infeasible = true;
  }

  const afterPlan: PlanBundle = {
    setup: plan.setup,
    budget,
    timeline,
    vendors: plan.vendors,
    readiness: plan.readiness,
  };

  return { plan: afterPlan, diff };
}

export { clampNonNegative };
