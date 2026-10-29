"use strict";

import { useCallback, useEffect, useState } from "react";
import type { PlanBundle, RiskFactor as SharedRiskFactor } from "@shared/types";
import { fetchRiskAnalysis } from "../lib/api";

type DisplayRisk = SharedRiskFactor & { id: string };

interface Props {
  plan?: PlanBundle | null;
}

const RiskAnalysis = ({ plan }: Props) => {
  const [risks, setRisks] = useState<DisplayRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"ai" | "fallback">("fallback");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!plan?.budget) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRiskAnalysis(plan);
      setSource(res.source);
      setRisks(res.risks.map((r, i) => ({ ...r, id: `risk-${i}` })));
    } catch {
      setError("Could not load AI risk analysis. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (plan?.budget) void load();
  }, [load, plan?.budget]);

  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const filteredRisks = risks.filter(
    (r) => filterSeverity === "all" || r.severity === filterSeverity,
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "var(--accent)";
      case "high":
        return "#FF6B6B";
      case "medium":
        return "var(--highlight)";
      case "low":
        return "var(--ok)";
      default:
        return "var(--muted)";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "budget":
        return "💰";
      case "timeline":
        return "📅";
      case "vendor":
        return "👥";
      case "weather":
        return "🌤";
      case "logistics":
        return "🚚";
      default:
        return "📋";
    }
  };

  const overallRiskScore =
    risks.reduce((sum, r) => sum + r.probability * r.impact, 0) / risks.length;
  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const highCount = risks.filter((r) => r.severity === "high").length;

  return (
    <div className="card risk-analysis">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2>AI Risk Analysis</h2>
        <div
          className="chip"
          style={{ background: "var(--pill-bg)", color: "var(--pill-ink)" }}
        >
          {loading
            ? "Analyzing…"
            : `${source === "ai" ? "Live AI · " : "Offline · "}${risks.length} risks`}
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: "var(--accent)", marginBottom: "1rem" }}>
          {error}{" "}
          <button
            className="btn btn-ghost"
            style={{ width: "auto", minHeight: 32 }}
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="risk-summary">
        <div className="summary-card">
          <div className="summary-label">Overall Risk Score</div>
          <div
            className="summary-value"
            style={{
              color: getSeverityColor(
                overallRiskScore > 0.5
                  ? "high"
                  : overallRiskScore > 0.3
                    ? "medium"
                    : "low",
              ),
            }}
          >
            {(overallRiskScore * 100).toFixed(0)}%
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Critical Risks</div>
          <div className="summary-value" style={{ color: "var(--accent)" }}>
            {criticalCount}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">High Priority</div>
          <div className="summary-value" style={{ color: "#FF6B6B" }}>
            {highCount}
          </div>
        </div>
      </div>

      <div className="risk-filters">
        <label>Filter by severity:</label>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="filter-select"
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="risk-list">
        {filteredRisks.map((risk) => (
          <div key={risk.id} className="risk-card">
            <div className="risk-header">
              <div className="risk-category">
                <span className="category-icon">{getCategoryIcon(risk.category)}</span>
                <span className="category-name">
                  {risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                </span>
              </div>
              <div
                className="risk-severity"
                style={{ color: getSeverityColor(risk.severity) }}
              >
                <span className="severity-icon">{getSeverityIcon(risk.severity)}</span>
                <span className="severity-label">{risk.severity.toUpperCase()}</span>
              </div>
            </div>

            <h3 className="risk-title">{risk.title}</h3>
            <p className="risk-description">{risk.description}</p>

            <div className="risk-metrics">
              <div className="metric">
                <span className="metric-label">Probability:</span>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{
                      width: `${risk.probability * 100}%`,
                      background: getSeverityColor(risk.severity),
                    }}
                  />
                  <span className="metric-value">
                    {(risk.probability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="metric">
                <span className="metric-label">Impact:</span>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{
                      width: `${risk.impact * 100}%`,
                      background: getSeverityColor(risk.severity),
                    }}
                  />
                  <span className="metric-value">{(risk.impact * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="risk-mitigation">
              <strong>Mitigation:</strong> {risk.mitigation}
            </div>

            {source === "ai" && (
              <div className="ai-badge">
                <span>✨ AI-Generated</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRisks.length === 0 && !loading && (
        <div className="empty-state">
          <p>
            {error
              ? "Fix the error above and retry."
              : "No risks found for this filter. Try selecting a different severity level."}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
