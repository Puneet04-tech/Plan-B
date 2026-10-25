"use strict";

import type { PlanBundle } from '@shared/types';

interface Props {
  plan: PlanBundle;
}

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

const VERDICT_CHIP: Record<string, { className: string; label: string }> = {
  tight: { className: 'chip chip-alert', label: 'Tight' },
  comfortable: { className: 'chip chip-success', label: 'Comfortable' },
  generous: { className: 'chip chip-warn', label: 'Generous' },
};

const StatCards = ({ plan }: Props) => {
  const verdict = VERDICT_CHIP[plan.budget.realism.verdict] ?? VERDICT_CHIP.comfortable;

  return (
    <div className="stat-grid" aria-label="Plan summary">
      <div className="stat-card">
        <div className="stat-label">Total budget</div>
        <div className="stat-value">{formatINR(plan.budget.total)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Per guest</div>
        <div className="stat-value">
          {formatINR(plan.budget.realism.perGuest)}{' '}
          <span className={verdict.className} title={plan.budget.realism.reason}>{verdict.label}</span>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Days left</div>
        <div className="stat-value">
          {plan.timeline.daysAvailable}{' '}
          {plan.timeline.rushMode && <span className="chip chip-alert">Rush</span>}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Readiness</div>
        <div className="stat-value">{plan.readiness.score}%</div>
      </div>
    </div>
  );
};

export default StatCards;
