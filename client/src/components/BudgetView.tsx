"use strict";

import { useMemo, useState } from 'react';
import type { BudgetPlan } from '@shared/types';

const COLORS = ['#2D2A6E', '#F5A623', '#2E9E6B', '#FF6B6B', '#5B5878', '#8A7FF0', '#E0A2C2', '#6BB8D6', '#D6C66B'];

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

interface Props {
  plan: BudgetPlan;
}

const BudgetView = ({ plan }: Props) => {
  const [actuals, setActuals] = useState<Record<string, number>>({});

  const nonContingency = useMemo(() => plan.lines.filter((l) => l.key !== 'contingency'), [plan.lines]);

  const segments = useMemo(() => {
    let offset = 0;
    const total = plan.total || 1;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    return nonContingency.map((line, i) => {
      const fraction = line.amount / total;
      const seg = {
        color: COLORS[i % COLORS.length],
        dash: `${fraction * circumference} ${circumference}`,
        offset: -offset * circumference,
        label: line.label,
      };
      offset += fraction;
      return seg;
    });
  }, [nonContingency, plan.total]);

  const onActualChange = (key: string, value: string) => {
    const num = Number(value);
    setActuals((prev) => ({ ...prev, [key]: Number.isFinite(num) ? num : 0 }));
  };

  return (
    <div className="card">
      <h2>Budget</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', margin: '1rem 0' }}>
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          role="img"
          aria-label={`Budget distribution donut chart across ${nonContingency.length} categories`}
        >
          <g transform="rotate(-90 75 75)">
            {segments.map((seg) => (
              <circle
                key={seg.label}
                className="donut-segment"
                cx="75"
                cy="75"
                r="60"
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={seg.dash}
                strokeDashoffset={seg.offset}
              />
            ))}
          </g>
          <text x="75" y="72" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">
            {formatINR(plan.total)}
          </text>
          <text x="75" y="90" textAnchor="middle" fontSize="10" fill="var(--muted)">
            total
          </text>
        </svg>

        <ul style={{ listStyle: 'none', fontSize: '0.85rem' }}>
          {segments.map((seg) => (
            <li key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, display: 'inline-block' }} />
              {seg.label}
            </li>
          ))}
        </ul>
      </div>

      <table>
        <caption>Budget lines with planned vs actual spend. Edit the Actual column to track.</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Planned</th>
            <th scope="col">Actual</th>
            <th scope="col">Difference</th>
          </tr>
        </thead>
        <tbody>
          {plan.lines.map((line) => {
            const actual = actuals[line.key];
            const diff = actual !== undefined ? line.amount - actual : null;
            return (
              <tr key={line.key}>
                <td>{line.label}</td>
                <td>{formatINR(line.amount)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    aria-label={`Actual spend for ${line.label}`}
                    value={actual ?? ''}
                    onChange={(e) => onActualChange(line.key, e.target.value)}
                    style={{ width: 110, minHeight: 44, padding: '0.4rem', border: '1.5px solid var(--rule)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink)' }}
                  />
                </td>
                <td>
                  {diff === null ? '—' : (
                    <span className={diff >= 0 ? 'delta-down' : 'delta-up'}>
                      {diff >= 0 ? `₹${diff.toLocaleString('en-IN')} left` : `₹${(-diff).toLocaleString('en-IN')} over`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetView;
