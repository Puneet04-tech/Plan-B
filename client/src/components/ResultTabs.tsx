"use strict";

import { useMemo, useState } from 'react';
import type { IdeasResponse, PlanBundle } from '@shared/types';
import BudgetView from './BudgetView';
import TimelineView from './TimelineView';
import VendorsView from './VendorsView';
import IdeasView from './IdeasView';
import DisruptionPanel from './DisruptionPanel';
import BudgetOptimizer from './BudgetOptimizer';
import RiskAnalysis from './RiskAnalysis';

interface Tab {
  id: string;
  label: string;
}

const TABS: Array<{ id: string; labelKey?: 'overview' | 'budgetTab' | 'timelineTab' | 'vendorsTab' | 'ideasTab' | 'planbTab'; label?: string; accent?: boolean }> = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'budget', labelKey: 'budgetTab' },
  { id: 'optimizer', label: '✨ AI Optimizer' },
  { id: 'timeline', labelKey: 'timelineTab' },
  { id: 'vendors', labelKey: 'vendorsTab' },
  { id: 'risk', label: '🛡 Risk Analysis' },
  { id: 'ideas', labelKey: 'ideasTab' },
  { id: 'planb', labelKey: 'planbTab', accent: true },
];

interface Props {
  plan: PlanBundle;
  ideas: IdeasResponse | null;
  onPlanUpdate: (plan: PlanBundle) => void;
  strings: {
    overview: string;
    budgetTab: string;
    timelineTab: string;
    vendorsTab: string;
    ideasTab: string;
    planbTab: string;
  };
}

const ResultTabs = ({ plan, ideas, onPlanUpdate, strings }: Props) => {
  const [active, setActive] = useState('overview');

  const panels = useMemo(
    () => ({
      overview: <Overview plan={plan} />,
      budget: <BudgetView plan={plan.budget} />,
      optimizer: <BudgetOptimizer planData={plan} />,
      timeline: <TimelineView plan={plan} />,
      vendors: <VendorsView plan={plan} />,
      risk: <RiskAnalysis planData={plan} />,
      ideas: <IdeasView ideas={ideas} plan={plan} />,
      planb: <DisruptionPanel plan={plan} onPlanUpdate={onPlanUpdate} />,
    }),
    [plan, ideas, onPlanUpdate],
  );

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      setActive(TABS[nextIndex].id);
      (e.currentTarget.parentElement?.children[nextIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Plan sections">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={`result-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`result-panel`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            data-accent={tab.accent || undefined}
          >
            {tab.label || (tab.labelKey ? strings[tab.labelKey] : tab.id)}
          </button>
        ))}
      </div>
      <div
        id="result-panel"
        role="tabpanel"
        aria-labelledby={`result-tab-${active}`}
        tabIndex={-1}
      >
        {panels[active as keyof typeof panels]}
      </div>
    </div>
  );
};

const Overview = ({ plan }: { plan: PlanBundle }) => (
  <div className="card">
    <h2>Overview</h2>
    <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1rem' }}>
      {plan.setup.eventType} · {plan.setup.city} · {plan.setup.guests} guests ·{' '}
      {new Date(`${plan.setup.eventDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
    </p>
    {plan.timeline.rushMode && (
      <p className="chip chip-alert" role="status" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        {plan.timeline.rushMessage}
      </p>
    )}
    <p style={{ color: 'var(--ink)' }}><strong>Realism:</strong> {plan.budget.realism.reason}</p>
    <p style={{ marginTop: '0.5rem', color: 'var(--ink)' }}><strong>Critical path:</strong> {plan.timeline.criticalPathLabel}</p>
    <p style={{ marginTop: '0.5rem', color: 'var(--ink)' }}>
      <strong>Vendor checklist:</strong> {plan.vendors.items.length} vendors across {new Set(plan.vendors.items.map((v) => v.category)).size} categories.
      Items marked <span className="chip chip-alert">backup</span> are high-risk and need a backup vendor.
    </p>
  </div>
);

export default ResultTabs;
