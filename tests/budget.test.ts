import { describe, it, expect } from 'vitest';
import { buildBudget, ideaCaps, computeRealism, BudgetError, BUDGET_TEMPLATES } from '../server/src/engine/budget';

describe('budget engine', () => {
  it.each(['wedding', 'birthday', 'community'] as const)('%s template sums to exactly 100', (eventType) => {
    const total = BUDGET_TEMPLATES[eventType].reduce((s, t) => s + t.percent, 0);
    expect(total).toBe(100);
  });

  it.each(['wedding', 'birthday', 'community'] as const)('%s lines sum exactly to total for awkward totals', (eventType) => {
    for (const budget of [499999, 100000, 123457, 500000]) {
      const plan = buildBudget(eventType, 100, budget);
      const sum = plan.lines.reduce((s, l) => s + l.amount, 0);
      expect(sum).toBe(budget);
    }
  });

  it('no single non-contingency category dominates (no 47% misc bug)', () => {
    const plan = buildBudget('wedding', 100, 500000);
    for (const line of plan.lines) {
      if (line.key === 'contingency') continue;
      expect(line.percent).toBeLessThanOrEqual(30);
    }
  });

  it('computes catering per guest', () => {
    const plan = buildBudget('wedding', 100, 500000);
    const catering = plan.lines.find((l) => l.key === 'catering')!;
    expect(catering.perGuest).toBe(Math.floor(catering.amount / 100));
  });

  it('realism verdicts at range boundaries', () => {
    // wedding range 1500-6000
    expect(computeRealism('wedding', 1499).verdict).toBe('tight');
    expect(computeRealism('wedding', 1500).verdict).toBe('comfortable');
    expect(computeRealism('wedding', 6000).verdict).toBe('comfortable');
    expect(computeRealism('wedding', 6001).verdict).toBe('generous');
  });

  it('rejects invalid inputs with typed errors', () => {
    expect(() => buildBudget('wedding', 0, 500000)).toThrow(BudgetError);
    expect(() => buildBudget('wedding', 100, 0)).toThrow(BudgetError);
    expect(() => buildBudget('wedding', 100, -5)).toThrow(BudgetError);
    expect(() => buildBudget('party' as never, 100, 500000)).toThrow(BudgetError);
  });

  it('idea caps map to budget lines', () => {
    const plan = buildBudget('wedding', 100, 500000);
    const caps = ideaCaps(plan);
    expect(caps.menu).toBe(plan.lines.find((l) => l.key === 'catering')!.amount);
    expect(caps.decor).toBe(plan.lines.find((l) => l.key === 'decor')!.amount);
  });
});
