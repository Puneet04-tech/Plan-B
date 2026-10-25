"use strict";

import { useState } from 'react';
import type { PlanBundle } from '@shared/types';
import { fetchDisruption } from '../lib/api';

const SCENARIOS = [
  { id: 'venue-cancelled' as const, label: '🏛️ Venue cancelled' },
  { id: 'rain' as const, label: '🌧️ Rain expected' },
  { id: 'guest-count-up-30' as const, label: '👥 Guests +30%' },
  { id: 'budget-cut-20' as const, label: '💰 Budget cut 20%' },
  { id: 'vendor-no-show-caterer' as const, label: '🍽️ Caterer no-show' },
];

interface Props {
  plan: PlanBundle | null;
}

const PlanBPanel = ({ plan }: Props) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (id: string) => {
    setError(null);
    setLoading(id);
    try {
      await fetchDisruption(plan!, id as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disruption failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="diff-panel">
      <h2 style={{ color: 'var(--alert)' }}>Plan B — the replanning control room</h2>
      <p style={{ margin: '0.5rem 0 1rem' }}>
        {plan
          ? 'Pick a scenario to see the full before/after diff: budget deltas, moved and added tasks, warnings.'
          : 'Generate a plan in the Event Planner tab first — then every scenario button replans it instantly.'}
      </p>
      {plan && (
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className="btn btn-scenario"
              disabled={loading !== null}
              onClick={() => void run(s.id)}
            >
              {loading === s.id ? 'Replanning…' : s.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="field-error" role="alert" style={{ marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default PlanBPanel;
