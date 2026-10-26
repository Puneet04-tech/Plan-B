"use strict";

import { useMemo, useState } from 'react';
import type { PlanBundle, TaskStatus } from '@shared/types';

interface TimelineInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
  actionable: boolean;
}

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

  const insights: TimelineInsight[] = useMemo(() => {
    const insights: TimelineInsight[] = [];

    const overdueTasks = plan.timeline.tasks.filter(t => t.status === 'overdue');
    if (overdueTasks.length > 0) {
      insights.push({
        id: 'overdue',
        type: 'warning',
        title: `${overdueTasks.length} Tasks Overdue`,
        description: 'These tasks are past their deadline. Consider prioritizing them immediately to avoid cascading delays.',
        actionable: true,
      });
    }

    const criticalTasks = plan.timeline.tasks.filter(t => t.isOnCriticalPath);
    if (criticalTasks.length > 2) {
      insights.push({
        id: 'critical',
        type: 'warning',
        title: 'High Critical Path Load',
        description: 'You have multiple critical path tasks pending. Focus on these to prevent event delays.',
        actionable: true,
      });
    }

    if (plan.timeline.rushMode) {
      insights.push({
        id: 'rush',
        type: 'warning',
        title: 'Timeline in Rush Mode',
        description: plan.timeline.rushMessage ?? 'The schedule is tight; high-risk tasks have been pulled forward.',
        actionable: true,
      });
    }

    const upcomingCritical = plan.timeline.tasks.filter(t => t.isOnCriticalPath && t.status === 'upcoming');
    if (upcomingCritical.length > 0) {
      insights.push({
        id: 'upcoming-critical',
        type: 'suggestion',
        title: 'Upcoming Critical Tasks',
        description: `${upcomingCritical.length} critical tasks approaching. Schedule buffer time for unexpected delays.`,
        actionable: true,
      });
    }

    return insights;
  }, [plan.timeline.tasks, plan.timeline.rushMode, plan.timeline.rushMessage]);

  const progress = useMemo(() => {
    const total = plan.timeline.tasks.length || 1;
    return Math.round((Object.values(done).filter(Boolean).length / total) * 100);
  }, [done, plan.timeline.tasks.length]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Run of Show</h2>
        <div className="chip" style={{ background: 'var(--pill-bg)', color: 'var(--pill-ink)' }}>
          AI Insights: {insights.length}
        </div>
      </div>

      {insights.length > 0 && (
        <div className="timeline-insights" style={{ marginBottom: '1.5rem' }}>
          {insights.map((insight) => (
            <div key={insight.id} className={`insight-card insight-${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon">
                  {insight.type === 'warning' ? '⚠' : insight.type === 'suggestion' ? '💡' : 'ℹ'}
                </span>
                <span className="insight-title">{insight.title}</span>
              </div>
              <p className="insight-description">{insight.description}</p>
              {insight.actionable && (
                <button className="btn btn-sm btn-ghost" style={{ marginTop: '0.5rem' }}>
                  Take Action
                </button>
              )}
            </div>
          ))}
        </div>
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
