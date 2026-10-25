"use strict";

import { useMemo, useState } from 'react';
import type { PlanBundle, TaskStatus } from '@shared/types';

const STATUS_META: Record<TaskStatus, { label: string; className: string; icon: string }> = {
  overdue: { label: 'Overdue', className: 'chip chip-alert', icon: '⚠' },
  'due-soon': { label: 'Due soon', className: 'chip chip-warn', icon: '⏳' },
  upcoming: { label: 'Upcoming', className: 'chip chip-success', icon: '→' },
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
      <h2>Timeline</h2>
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
          style={{ height: 10, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}
        >
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{progress}% complete</span>
      </div>

      <ul className="stepper">
        {plan.timeline.tasks.map((task) => {
          const meta = STATUS_META[task.status];
          return (
            <li
              key={task.id}
              data-status={task.status}
              data-critical={task.isOnCriticalPath}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="checkbox"
                  id={`task-${task.id}`}
                  checked={!!done[task.id]}
                  onChange={(e) => setDone((prev) => ({ ...prev, [task.id]: e.target.checked }))}
                  aria-label={`Mark "${task.title}" done`}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor={`task-${task.id}`} style={{ fontWeight: 600, cursor: 'pointer' }}>
                  {task.title}
                </label>
                {task.isOnCriticalPath && <span className="chip chip-warn">Critical path</span>}
                <span className={meta.className}>
                  <span aria-hidden="true">{meta.icon} </span>
                  {meta.label}
                </span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {task.displayDate} · {task.category}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TimelineView;
