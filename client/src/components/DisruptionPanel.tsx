"use strict";

import { useState } from 'react';
import type { DisruptionResult, PlanBundle, ScenarioType } from '@shared/types';
import { fetchDisruption } from '../lib/api';

const SCENARIOS: Array<{ id: ScenarioType; label: string }> = [
  { id: 'venue-cancelled', label: '🏛️ Venue cancelled' },
  { id: 'rain', label: '🌧️ Rain expected' },
  { id: 'guest-count-up-30', label: '👥 Guests +30%' },
  { id: 'budget-cut-20', label: '💰 Budget cut 20%' },
  { id: 'vendor-no-show-caterer', label: '🍽️ Caterer no-show' },
];

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

interface Props {
  plan: PlanBundle | null;
  onPlanUpdate?: (plan: PlanBundle) => void;
}

const DisruptionPanel = ({ plan }: Props) => {
  const [result, setResult] = useState<DisruptionResult | null>(null);
  const [loading, setLoading] = useState<ScenarioType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = async (scenario: ScenarioType) => {
    if (!plan) return;
    setLoading(scenario);
    setError(null);
    try {
      const res = await fetchDisruption(plan, scenario);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply disruption');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="diff-panel" role="region" aria-label="Disruption simulator">
        <h2 style={{ color: 'var(--alert)' }}>Something went wrong? Plan B handles it.</h2>
        <p style={{ margin: '0.5rem 0 1rem' }}>
          One click replans your budget and timeline. Numbers come from the deterministic engine — never guessed.
        </p>

        {!plan && (
          <p style={{ color: 'var(--muted)' }}>
            Generate a plan in the Event Planner tab first, then come back here to simulate disruptions.
          </p>
        )}

        {plan && (
          <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                className="btn btn-scenario"
                disabled={loading !== null}
                onClick={() => void apply(s.id)}
              >
                {loading === s.id ? 'Replanning…' : s.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="field-error" role="alert" style={{ marginTop: '1rem' }}>{error}</p>
        )}
      </div>

      {result && (
        <div className="card" style={{ marginTop: '1.5rem' }} aria-live="polite">
          <h2>{result.diff.label} — impact</h2>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Before</div>
              <div className="stat-value">{formatINR(result.diff.before)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">After</div>
              <div className="stat-value">{formatINR(result.diff.after)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Change</div>
              <div className={`stat-value ${result.diff.after >= result.diff.before ? 'delta-up' : 'delta-down'}`}>
                {result.diff.after >= result.diff.before ? '+' : ''}
                {formatINR(result.diff.after - result.diff.before)}
              </div>
            </div>
          </div>

          {result.diff.infeasible && (
            <p className="chip chip-alert" role="alert" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              Plan may be infeasible — see warnings
            </p>
          )}

          {result.diff.budgetChanges.length > 0 && (
            <>
              <h3>Budget changes</h3>
              <table>
                <caption>Every adjusted budget line with its reason.</caption>
                <thead>
                  <tr><th scope="col">Category</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Reason</th></tr>
                </thead>
                <tbody>
                  {result.diff.budgetChanges.map((c, i) => (
                    <tr key={i}>
                      <td>{c.category}</td>
                      <td>{formatINR(c.from)}</td>
                      <td>{formatINR(c.to)}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {result.diff.addedTasks.length > 0 && (
            <>
              <h3 style={{ marginTop: '1rem' }}>New urgent tasks</h3>
              <ul style={{ paddingLeft: '1.25rem' }}>
                {result.diff.addedTasks.map((t, i) => (
                  <li key={i}><strong>{t.title}</strong> — due {t.displayDate} ({t.reason})</li>
                ))}
              </ul>
            </>
          )}

          {result.diff.taskChanges.length > 0 && (
            <>
              <h3 style={{ marginTop: '1rem' }}>Moved tasks</h3>
              <ul style={{ paddingLeft: '1.25rem' }}>
                {result.diff.taskChanges.map((t, i) => (
                  <li key={i}>{t.id}: {t.from} → {t.to} ({t.reason})</li>
                ))}
              </ul>
            </>
          )}

          {result.diff.warnings.length > 0 && (
            <div role="alert" style={{ marginTop: '1rem' }}>
              <h3>Warnings</h3>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--alert)' }}>
                {result.diff.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DisruptionPanel;
