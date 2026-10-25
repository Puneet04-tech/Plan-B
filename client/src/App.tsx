"use strict";

import { useCallback, useMemo, useRef, useState } from 'react';
import type { PlanBundle, PlanRequest } from '@shared/types';
import { fetchPlan, fetchIdeas } from './lib/api';
import type { IdeasResponse } from '@shared/types';
import { t, type Lang } from './lib/i18n';
import EventForm from './components/EventForm';
import StatCards from './components/StatCards';
import ResultTabs from './components/ResultTabs';
import PlanBPanel from './components/PlanBPanel';

type TopTab = 'planner' | 'simulator';

const App = () => {
  const [topTab, setTopTab] = useState<TopTab>('planner');
  const [lang, setLang] = useState<Lang>('en');
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
          <span className="logo-word">{strings.appName}</span>
          <span className="tagline">{strings.tagline}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn"
            style={{ width: 'auto', background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--border)', padding: '0.5rem 1rem' }}
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label={lang === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
          >
            {lang === 'en' ? 'हिं' : 'EN'}
          </button>
          <button
            className="btn"
            style={{ width: 'auto', background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--border)', padding: '0.5rem 1rem' }}
            onClick={() => window.print()}
            title={strings.exportHint}
          >
            🖨 {strings.print}
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
          {topTab === 'planner' ? (
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
                    <p style={{ color: 'var(--alert)' }}>{error}</p>
                    <button className="btn btn-primary" onClick={retry} style={{ marginTop: '1rem', width: 'auto' }}>
                      {strings.retry}
                    </button>
                  </div>
                )}
                {!loading && !error && !plan && (
                  <div className="card">
                    <h2>{strings.welcome}</h2>
                    <p style={{ color: 'var(--muted)' }}>
                      {strings.welcomeBody}
                    </p>
                  </div>
                )}
                {!loading && !error && plan && (
                  <>
                    <StatCards plan={plan} strings={strings} />
                    <ResultTabs plan={plan} ideas={ideas} onPlanUpdate={setPlan} strings={strings} />
                  </>
                )}
              </div>
            </div>
          ) : (
            <PlanBPanel plan={plan} />
          )}
        </div>
      </main>

      <footer style={{ marginTop: '3rem', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
        Plan B — event planning that expects the unexpected. Numbers from deterministic engines; AI writes ideas only.
      </footer>
    </div>
  );
};

export default App;
