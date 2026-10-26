"use strict";

import { useState } from 'react';

interface OptimizationSuggestion {
  id: string;
  category: string;
  currentCost: number;
  suggestedCost: number;
  savings: number;
  description: string;
  confidence: number;
  type: 'reduce' | 'reallocate' | 'negotiate';
}

interface Props {
  planData?: any;
  onApplyOptimization?: (suggestion: OptimizationSuggestion) => void;
}

const BudgetOptimizer = ({ planData, onApplyOptimization }: Props) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      category: 'Catering',
      currentCost: 120000,
      suggestedCost: 95000,
      savings: 25000,
      description: 'Consider buffet-style service instead of plated meals. Estimated 20% savings while maintaining guest satisfaction.',
      confidence: 0.85,
      type: 'reduce',
    },
    {
      id: '2',
      category: 'Decor',
      currentCost: 80000,
      suggestedCost: 65000,
      savings: 15000,
      description: 'Use more rental items instead of purchasing. Mix of fresh and artificial flowers can reduce costs by 25%.',
      confidence: 0.78,
      type: 'reallocate',
    },
    {
      id: '3',
      category: 'Entertainment',
      currentCost: 50000,
      suggestedCost: 35000,
      savings: 15000,
      description: 'Negotiate with local bands or DJs. Book off-peak hours for better rates. 30% potential savings.',
      confidence: 0.72,
      type: 'negotiate',
    },
  ]);

  const totalSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);
  const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;

  const handleApply = (suggestion: OptimizationSuggestion) => {
    if (onApplyOptimization) {
      onApplyOptimization(suggestion);
    }
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'var(--ok)';
    if (confidence >= 0.6) return 'var(--highlight)';
    return 'var(--accent)';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reduce':
        return '↓';
      case 'reallocate':
        return '↔';
      case 'negotiate':
        return '💬';
      default:
        return '•';
    }
  };

  return (
    <div className="card budget-optimizer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>AI Budget Optimizer</h2>
        <div className="chip" style={{ background: 'var(--pill-bg)', color: 'var(--pill-ink)' }}>
          Powered by AI
        </div>
      </div>

      <div className="optimizer-summary">
        <div className="summary-item">
          <div className="summary-label">Potential Savings</div>
          <div className="summary-value highlight">₹{totalSavings.toLocaleString('en-IN')}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">AI Confidence</div>
          <div className="summary-value">
            {(avgConfidence * 100).toFixed(0)}%
            <span className="confidence-indicator" style={{ color: getConfidenceColor(avgConfidence) }}>
              ●
            </span>
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
              <div className="suggestion-confidence" style={{ color: getConfidenceColor(suggestion.confidence) }}>
                {(suggestion.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>

            <div className="suggestion-costs">
              <div className="cost-item">
                <span className="cost-label">Current:</span>
                <span className="cost-value">₹{suggestion.currentCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="cost-arrow">→</div>
              <div className="cost-item">
                <span className="cost-label">Suggested:</span>
                <span className="cost-value highlight">₹{suggestion.suggestedCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="cost-savings">
                Save ₹{suggestion.savings.toLocaleString('en-IN')}
              </div>
            </div>

            <p className="suggestion-description">{suggestion.description}</p>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleApply(suggestion)}
              style={{ marginTop: '1rem', width: 'auto' }}
            >
              Apply Suggestion
            </button>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="empty-state">
          <p>All optimizations applied! Your budget is now optimized.</p>
        </div>
      )}
    </div>
  );
};

export default BudgetOptimizer;
