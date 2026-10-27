"use strict";

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PlanBundle, PlanRequest } from '@shared/types';
import { fetchPlan, fetchIdeas } from './lib/api';
import type { IdeasResponse } from '@shared/types';
import { t, type Lang } from './lib/i18n';
import { useTheme } from './lib/theme';
import EventForm from './components/EventForm';
import Landing from './components/Landing';
import StatCards from './components/StatCards';
import ResultTabs from './components/ResultTabs';
import PlanBPanel from './components/PlanBPanel';
import AIChat from './components/AIChat';
import BudgetOptimizer from './components/BudgetOptimizer';

type TopTab = 'landing' | 'planner' | 'simulator';

const App = () => {
  const [topTab, setTopTab] = useState<TopTab>('landing');
  const [lang, setLang] = useState<Lang>('en');
  const [theme, toggleTheme] = useTheme();
  const strings = t(lang);
  const [plan, setPlan] = useState<PlanBundle | null>(null);
  const [ideas, setIdeas] = useState<IdeasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async (request: PlanRequest) => {
    setLoading(true);
    setError(null);
    setLastRequest(request);
    try {
      const [newPlan, newIdeas] = await Promise.all([fetchPlan(request), fetchIdeas(request)]);
      setPlan(newPlan);
      setIdeas(newIdeas);
      resultsRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (lastRequest) void generate(lastRequest);
  }, [generate, lastRequest]);

  const tabs = useMemo(
    () => [
      { id: 'planner' as const, label: strings.plannerTab },
      { id: 'simulator' as const, label: strings.simulatorTab },
    ],
    [strings],
  );

  const onTopTabKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const next = tabs[(index + 1) % tabs.length];
      setTopTab(next.id);
      (e.currentTarget.parentElement?.children[(index + 1) % tabs.length] as HTMLElement)?.focus();
    } else if (e.key === 'ArrowLeft') {
      const next = tabs[(index - 1 + tabs.length) % tabs.length];
      setTopTab(next.id);
      (e.currentTarget.parentElement?.children[(index - 1 + tabs.length) % tabs.length] as HTMLElement)?.focus();
    }
  };

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className="app-header">
        <div className="logo">
          <span className="logo-word">Plan B</span>
          <span className="logo-sub">Urban Intelligence Platform</span>
        </div>
        <div className="header-actions">
          <button
            className="lang-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label={lang === 'en' ? 'Switch language to Hindi' : 'भाषा बदलें — अंग्रेज़ी'}
          >
            <span aria-hidden="true">Language: </span>{lang === 'en' ? 'हिं' : 'EN'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            title={strings.exportHint}
          >
            {strings.print}
          </button>
          <nav aria-label="Primary">
          <div role="tablist" aria-label="Sections">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                role="tab"
                id={`top-tab-${tab.id}`}
                aria-selected={topTab === tab.id}
                aria-controls={topTab === tab.id ? 'top-panel' : undefined}
                tabIndex={topTab === tab.id ? 0 : -1}
                onClick={() => setTopTab(tab.id)}
                onKeyDown={(e) => onTopTabKey(e, i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
        </div>
      </header>

      <main id="main">
        <div
          id="top-panel"
          role="tabpanel"
          aria-labelledby={`top-tab-${topTab}`}
        >
          {topTab === 'landing' && <Landing onGetStarted={() => setTopTab('planner')} />}
          {topTab === 'planner' && (
            <div className="layout">
              <div className="form-panel">
                <EventForm onGenerate={generate} disabled={loading} strings={strings} />
              </div>
              <div ref={resultsRef} tabIndex={-1} aria-live="polite">
                {loading && (
                  <div className="card" role="status">
                    <h2>{strings.generating}</h2>
                    <div className="skeleton" style={{ width: '60%', marginBottom: '0.75rem' }} />
                    <div className="skeleton" style={{ width: '85%', marginBottom: '0.75rem' }} />
                    <div className="skeleton" style={{ width: '45%' }} />
                  </div>
                )}
                {!loading && error && (
                  <div className="card" role="alert">
                    <h2>Something went wrong</h2>
                    <p style={{ color: 'var(--accent)' }}>{error}</p>
                    <button className="btn btn-primary" onClick={retry} style={{ marginTop: '1rem', width: 'auto' }}>
                      {strings.retry}
                    </button>
                  </div>
                )}
                {!loading && !error && !plan && (
                  <SamplePreview />
                )}
                {!loading && !error && plan && (
                  <>
                    <StatCards plan={plan} strings={strings} />
                    <ResultTabs plan={plan} ideas={ideas} onPlanUpdate={setPlan} strings={strings} />
                  </>
                )}
              </div>
            </div>
          )}
          {topTab === 'simulator' && <PlanBPanel plan={plan} />}

          <AIChat plan={plan} />
        </div>
      </main>

      <footer style={{ marginTop: '3rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        Plan B — event planning that expects the unexpected. Numbers from deterministic engines; AI writes ideas only.
      </footer>
    </div>
  );
};

export default App;

/** Greyed sample plan shown before the first real generation. */
function SamplePreview() {
  return (
    <div className="sample-plan" aria-hidden="true">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total budget</div>
          <div className="stat-value money">₹3,00,000</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Per guest</div>
          <div className="stat-value money">₹3,000 <span className="chip chip-ok">COMFORTABLE</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Days left</div>
          <div className="stat-value num">30</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Readiness</div>
          <div className="stat-value num">0%</div>
        </div>
      </div>
      <div className="card">
        <h2>Sample run of show</h2>
        <ul className="cue-sheet">
          <li className="cue-row" data-critical="true">
            <span className="cue-date">24 Nov 2026</span>
            <span className="cue-task">Get event permissions</span>
            <span className="status-label">UPCOMING</span>
          </li>
          <li className="cue-row">
            <span className="cue-date">26 Nov 2026</span>
            <span className="cue-task">Promote the event</span>
            <span className="status-label">UPCOMING</span>
          </li>
          <li className="cue-row" data-critical="true">
            <span className="cue-date">25 Dec 2026</span>
            <span className="cue-task">Event day</span>
            <span className="status-label">UPCOMING</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
