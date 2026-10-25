"use strict";

import { useMemo, useState } from 'react';
import type { PlanBundle, TaskStatus } from '@shared/types';

// Cue-sheet: status conveyed by text label + icon, never color alone.
const STATUS_META: Record<TaskStatus, { label: string; icon: string }> = {
  overdue: { label: 'OVERDUE', icon: '⚠' },
  'due-soon': { label: 'DUE SOON', icon: '⏳' },
  upcoming: { label: 'UPCOMING', icon: '→' },
};

interface Props {
  plan: PlanBundle;
}

const TimelineView = ({ plan }: Props) => {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const progress = useMemo(() => {
    const total = plan.timeline.tasks.length || 1;
    return Math.round((Object.values(done).filter(Boolean).length / total) * 100);
  }, [done, plan.timeline.tasks.length]);

  return (
    <div className="card">
      <h2>Run of show</h2>
      {plan.timeline.rushMessage && (
        <p className="chip chip-alert" role="status" style={{ display: 'inline-block', margin: '0.5rem 0 1rem' }}>
          {plan.timeline.rushMessage}
        </p>
      )}

      <div style={{ margin: '0.75rem 0 1.5rem' }}>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion"
          style={{ height: 8, background: 'var(--rule)', borderRadius: 3, overflow: 'hidden' }}
        >
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--ok)' }} />
        </div>
        <span className="num" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{progress}% complete</span>
      </div>

      <ul className="cue-sheet" aria-label="Task cue sheet">
        {plan.timeline.tasks.map((task) => {
          const meta = STATUS_META[task.status];
          return (
            <li
              key={task.id}
              className="cue-row"
              data-status={task.status}
              data-critical={task.isOnCriticalPath}
            >
              <span className="cue-date">{task.displayDate}</span>
              <span className="cue-task">
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  checked={!!done[task.id]}
                  onChange={(e) => setDone((prev) => ({ ...prev, [task.id]: e.target.checked }))}
                  aria-label={`Mark "${task.title}" done`}
                  style={{ width: 18, height: 18, verticalAlign: '-3px', marginRight: '0.5rem' }}
                />
                <label htmlFor={`task-${task.id}`} style={{ cursor: 'pointer' }}>{task.title}</label>
                {task.isOnCriticalPath && <span className="redline-label">critical path</span>}
              </span>
              <span className="status-label">
                <span aria-hidden="true">{meta.icon} </span>
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TimelineView;
