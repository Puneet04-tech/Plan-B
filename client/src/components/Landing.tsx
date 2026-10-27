"use strict";

interface Props {
  onGetStarted: () => void;
}

/**
 * Landing view: glowing gradient hero, floating pill badge and three dark
 * feature cards, matching the Metabolic City reference.
 */
const Landing = ({ onGetStarted }: Props) => {
  const features = [
    {
      icon: '◎',
      color: '#60A5FA', // electric blue
      title: 'Realistic budgets',
      body: 'Deterministic engine allocates every rupee — venue, catering, decor — with per-guest realism verdicts. No guessed numbers, ever.',
    },
    {
      icon: '⇄',
      color: '#A78BFA', // vivid violet
      title: 'Plans that replan',
      body: 'Venue cancelled? Rain? Guests +30%? One click recalculates the budget and timeline and shows a redline diff of exactly what changed.',
    },
    {
      icon: '✦',
      color: '#FBBF24', // amber gold
      title: 'AI that knows its lane',
      body: 'Cloudflare Workers AI writes personalized ideas, answers questions and flags risks — grounded in your actual plan, capped by your budget.',
    },
  ];

  return (
    <div className="landing">
      <div className="hero">
        <span className="hero-badge">AI-powered · India-first · Works offline</span>
        <h1 className="hero-title">
          Plan events that <span className="hero-grad">expect the unexpected</span>
        </h1>
        <p className="hero-sub">
          Plan B builds a realistic budget, timeline and vendor checklist for weddings,
          birthdays and community events — then replans instantly when something goes wrong.
        </p>
        <button className="btn btn-primary hero-cta" onClick={onGetStarted}>
          Start planning — it's free
        </button>
        <p className="hero-note">No sign-up. Runs entirely on your machine.</p>
      </div>

      <div className="feature-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.title}>
            <span className="feature-icon" style={{ '--icon-c': f.color } as React.CSSProperties} aria-hidden="true">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>

      <div className="landing-strip">
        <div className="strip-item">
          <span className="strip-num">5</span>
          <span className="strip-label">disruption scenarios simulated</span>
        </div>
        <div className="strip-item">
          <span className="strip-num">100%</span>
          <span className="strip-label">budget lines that reconcile exactly</span>
        </div>
        <div className="strip-item">
          <span className="strip-num">3</span>
          <span className="strip-label">event types fully supported</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
