"use strict";

import type { PlanBundle } from '@shared/types';

interface Props {
  plan: PlanBundle;
  strings: {
    totalBudget: string;
    perGuest: string;
    daysLeft: string;
    readiness: string;
  };
}

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

const VERDICT_CHIP: Record<string, { className: string; label: string }> = {
  tight: { className: 'chip chip-alert', label: 'Tight' },
  comfortable: { className: 'chip chip-success', label: 'Comfortable' },
  generous: { className: 'chip chip-warn', label: 'Generous' },
};

const StatCards = ({ plan, strings }: Props) => {
  const verdict = VERDICT_CHIP[plan.budget.realism.verdict] ?? VERDICT_CHIP.comfortable;

  return (
    <div className="stat-grid" aria-label="Plan summary">
      <div className="stat-card">
        <div className="stat-label">{strings.totalBudget}</div>
        <div className="stat-value">{formatINR(plan.budget.total)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.perGuest}</div>
        <div className="stat-value">
          {formatINR(plan.budget.realism.perGuest)}{' '}
          <span className={verdict.className} title={plan.budget.realism.reason}>{verdict.label}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.daysLeft}</div>
        <div className="stat-value">
          {plan.timeline.daysAvailable}{' '}
          {plan.timeline.rushMode && <span className="chip chip-alert">Rush</span>}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.readiness}</div>
        <div className="stat-value">{plan.readiness.score}%</div>
      </div>
    </div>
  );
};

export default StatCards;
