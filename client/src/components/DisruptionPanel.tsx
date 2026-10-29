"use strict";

import { useState } from "react";
import type { DisruptionResult, PlanBundle, ScenarioType } from "@shared/types";
import { fetchDisruption, fetchRecoveryTips } from "../lib/api";

const SCENARIOS: Array<{ id: ScenarioType; label: string }> = [
  { id: "venue-cancelled", label: "Venue cancelled" },
  { id: "rain", label: "Rain expected" },
  { id: "guest-count-up-30", label: "Guests +30%" },
  { id: "budget-cut-20", label: "Budget cut 20%" },
  { id: "vendor-no-show-caterer", label: "Caterer no-show" },
];

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Redline: struck-through old value + highlighted new value + text label. */
const Redline = ({ from, to }: { from: number; to: number }) => (
  <>
    <span className="redline-old">{formatINR(from)}</span>{" "}
    <span className="redline-new">{formatINR(to)}</span>
    <span className="redline-label">
      was {formatINR(from)}, now {formatINR(to)} ({to >= from ? "+" : "−"}
      {formatINR(Math.abs(to - from))})
    </span>
  </>
);

interface Props {
  plan: PlanBundle | null;
  onPlanUpdate?: (plan: PlanBundle) => void;
}

const DisruptionPanel = ({ plan }: Props) => {
  const [result, setResult] = useState<DisruptionResult | null>(null);
  const [loading, setLoading] = useState<ScenarioType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<{ list: string[]; source: "ai" | "fallback" } | null>(
    null,
  );
  const [tipsLoading, setTipsLoading] = useState(false);

  const loadTips = async () => {
    if (!result) return;
    setTipsLoading(true);
    try {
      const res = await fetchRecoveryTips(result.diff.label, result.plan.setup.eventType);
      setTips({ list: res.tips, source: res.source });
    } catch {
      setTips(null);
    } finally {
      setTipsLoading(false);
    }
  };

  const apply = async (scenario: ScenarioType) => {
    if (!plan) return;
    setLoading(scenario);
    setError(null);
    try {
      const res = await fetchDisruption(plan, scenario);
      setResult(res);
      setTips(null); // fresh scenario: clear stale tips
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply disruption");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="diff-panel" role="region" aria-label="Disruption simulator">
        <h2>Something went wrong? Plan B handles it.</h2>
        <p style={{ margin: "0.5rem 0 1rem", color: "var(--muted)" }}>
          One click replans the budget and timeline. Every change is shown as a redline —
          the old value struck through, the new value highlighted, with the amounts
          spelled out in text.
        </p>

        {!plan && (
          <p style={{ color: "var(--muted)" }}>
            Generate a plan in the Event Planner first, then simulate disruptions here.
          </p>
        )}

        {plan && (
          <div style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}>
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                className="btn btn-scenario"
                disabled={loading !== null}
                onClick={() => void apply(s.id)}
              >
                {loading === s.id ? "Replanning…" : s.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="field-error" role="alert" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="card" style={{ marginTop: "1.5rem" }} aria-live="polite">
          <h2>{result.diff.label} — redline diff</h2>

          <p style={{ margin: "0.75rem 0" }}>
            Total: <span className="redline-old">{formatINR(result.diff.before)}</span>{" "}
            <span className="redline-new">{formatINR(result.diff.after)}</span>
            <span className="redline-label">
              was {formatINR(result.diff.before)}, now {formatINR(result.diff.after)} (
              {result.diff.after >= result.diff.before ? "+" : "−"}
              {formatINR(Math.abs(result.diff.after - result.diff.before))})
            </span>
          </p>

          {result.diff.infeasible && (
            <p
              className="chip chip-alert"
              role="alert"
              style={{ display: "inline-block", marginBottom: "1rem" }}
            >
              Plan may be infeasible — see warnings below
            </p>
          )}

          {result.diff.budgetChanges.length > 0 && (
            <>
              <h3>Budget changes</h3>
              <div className="table-scroll">
                <table>
                  <caption>
                    Every adjusted budget line, old vs new with the reason.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Change</th>
                      <th scope="col">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.diff.budgetChanges.map((c, i) => (
                      <tr key={i}>
                        <td>{c.category}</td>
                        <td>
                          <Redline from={c.from} to={c.to} />
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                          {c.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.diff.addedTasks.length > 0 && (
            <>
              <h3 style={{ marginTop: "1rem" }}>New urgent tasks</h3>
              <ul style={{ paddingLeft: "1.25rem" }}>
                {result.diff.addedTasks.map((t, i) => (
                  <li key={i}>
                    <strong>{t.title}</strong> — due{" "}
                    <span className="date">{t.displayDate}</span> ({t.reason})
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.diff.warnings.length > 0 && (
            <div role="alert" style={{ marginTop: "1rem" }}>
              <h3>Warnings</h3>
              <ul style={{ paddingLeft: "1.25rem", color: "var(--accent)" }}>
                {result.diff.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: "1.25rem" }}>
            <button
              className="btn btn-ghost"
              onClick={() => void loadTips()}
              disabled={tipsLoading}
            >
              {tipsLoading ? "Getting tips…" : "Get recovery tips (AI)"}
            </button>
            {tips && (
              <div
                role="region"
                aria-label="Recovery tips"
                style={{ marginTop: "0.75rem" }}
              >
                {tips.source === "fallback" && (
                  <p
                    className="chip chip-warn"
                    style={{ display: "inline-block", marginBottom: "0.5rem" }}
                  >
                    Offline suggestions
                  </p>
                )}
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {tips.list.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisruptionPanel;
