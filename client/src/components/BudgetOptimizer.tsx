"use strict";

import { useCallback, useEffect, useState } from "react";
import type { BudgetSuggestion, PlanBundle } from "@shared/types";
import { fetchBudgetOptimizer } from "../lib/api";

interface DisplaySuggestion extends BudgetSuggestion {
  id: string;
}

interface Props {
  plan?: PlanBundle | null;
  onApplyOptimization?: (suggestion: BudgetSuggestion) => void;
}

const BudgetOptimizer = ({ plan, onApplyOptimization }: Props) => {
  const [suggestions, setSuggestions] = useState<DisplaySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"ai" | "fallback">("fallback");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!plan?.budget) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBudgetOptimizer(plan);
      setSource(res.source);
      setSuggestions(res.suggestions.map((s, i) => ({ ...s, id: `${s.category}-${i}` })));
    } catch {
      setError("Could not load AI optimizations. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (plan?.budget) void load();
  }, [load, plan?.budget]);

  const totalSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);

  const handleApply = (suggestion: DisplaySuggestion) => {
    if (onApplyOptimization) {
      onApplyOptimization(suggestion);
    }
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reduce":
        return "↓";
      case "reallocate":
        return "↔";
      case "negotiate":
        return "💬";
      default:
        return "•";
    }
  };

  return (
    <div className="card budget-optimizer">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2>AI Budget Optimizer</h2>
        <div
          className="chip"
          style={{ background: "var(--pill-bg)", color: "var(--pill-ink)" }}
        >
          {loading ? "Analyzing…" : source === "ai" ? "Live AI" : "Offline suggestions"}
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

      <div className="optimizer-summary">
        <div className="summary-item">
          <div className="summary-label">Potential Savings</div>
          <div className="summary-value highlight">
            ₹{totalSavings.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Suggestions</div>
          <div className="summary-value">{suggestions.length}</div>
        </div>
      </div>

      <div className="suggestions-list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="suggestion-card">
            <div className="suggestion-header">
              <div className="suggestion-category">
                <span className="type-icon">{getTypeIcon(suggestion.type)}</span>
                {suggestion.category}
              </div>
            </div>

            <div className="suggestion-costs">
              <div className="cost-item">
                <span className="cost-label">Current:</span>
                <span className="cost-value">
                  ₹{suggestion.currentCost.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="cost-arrow">→</div>
              <div className="cost-item">
                <span className="cost-label">Suggested:</span>
                <span className="cost-value highlight">
                  ₹{suggestion.suggestedCost.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="cost-savings">
                Save ₹{suggestion.savings.toLocaleString("en-IN")}
              </div>
            </div>

            <p className="suggestion-description">{suggestion.description}</p>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleApply(suggestion)}
              style={{ marginTop: "1rem", width: "auto" }}
            >
              Apply Suggestion
            </button>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && !loading && !error && (
        <div className="empty-state">
          <p>
            {source === "ai"
              ? "All optimizations applied! Your budget is now optimized."
              : "No suggestions available right now."}
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetOptimizer;
