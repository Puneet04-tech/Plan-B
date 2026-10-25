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

// Verdict chips carry text labels; the reasoning is spelled out in the tooltip.
const VERDICT_LABEL: Record<string, string> = {
  tight: 'TIGHT',
  comfortable: 'COMFORTABLE',
  generous: 'ROOMY',
};

const StatCards = ({ plan, strings }: Props) => {
  const realism = plan.budget.realism;
  const verdict = VERDICT_LABEL[realism.verdict] ?? 'COMFORTABLE';

  return (
    <div className="stat-grid" aria-label="Plan summary">
      <div className="stat-card">
        <div className="stat-label">{strings.totalBudget}</div>
        <div className="stat-value money">{formatINR(plan.budget.total)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.perGuest}</div>
        <div className="stat-value money">
          {formatINR(realism.perGuest)}{' '}
          <span className={`chip ${realism.verdict === 'tight' ? 'chip-alert' : 'chip-ok'}`} title={realism.reason}>
            {verdict}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{realism.reason}</span>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.daysLeft}</div>
        <div className="stat-value num">
          {plan.timeline.daysAvailable}{' '}
          {plan.timeline.rushMode && <span className="chip chip-alert">RUSH</span>}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{strings.readiness}</div>
        <div className="stat-value num">{plan.readiness.score}%</div>
      </div>
    </div>
  );
};

export default StatCards;
