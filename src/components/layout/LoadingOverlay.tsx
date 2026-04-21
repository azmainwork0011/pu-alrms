/**
 * LoadingOverlay — Pure static HTML/CSS loading screen.
 *
 * Hydration-safe: zero client-side JS, no useState/useEffect.
 * Server and client render identical markup.
 *
 * Visibility is controlled by CSS:
 *   - Shown when html does NOT have class "hydrated"
 *   - Hidden (with fade-out transition) when html DOES have class "hydrated"
 *     (added by page.tsx useEffect on mount)
 *
 * Dark mode: next-themes injects class="dark" on <html> BEFORE hydration,
 * so CSS selectors like `html.dark .pu-lo-*` work correctly.
 */

export function LoadingOverlay() {
  return (
    <div className="pu-lo" aria-hidden="true">
      {/* ── Animated background ── */}
      <div className="pu-lo-bg" />

      {/* ── Floating particles ── */}
      <div className="pu-lo-particles">
        <span className="pu-lo-dot" />
        <span className="pu-lo-dot" />
        <span className="pu-lo-dot" />
        <span className="pu-lo-dot" />
        <span className="pu-lo-dot" />
        <span className="pu-lo-dot" />
      </div>

      {/* ── Main content ── */}
      <div className="pu-lo-content">
        {/* Logo with orbiting rings */}
        <div className="pu-lo-logo">
          <div className="pu-lo-ring pu-lo-ring-1" />
          <div className="pu-lo-ring pu-lo-ring-2" />
          <div className="pu-lo-ring pu-lo-ring-3" />
          <svg
            className="pu-lo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
          </svg>
        </div>

        {/* Title */}
        <div className="pu-lo-title-wrap">
          <h1 className="pu-lo-title">PU-ALRMS</h1>
          <div className="pu-lo-title-line" />
        </div>

        {/* Tagline with animated dots */}
        <p className="pu-lo-tagline">
          Loading your experience
          <span className="pu-lo-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>

        {/* Progress bar */}
        <div className="pu-lo-bar-track">
          <div className="pu-lo-bar-fill" />
        </div>

        {/* Staged progress indicators */}
        <div className="pu-lo-steps">
          <span className="pu-lo-step" aria-label="Auth step">Auth</span>
          <span className="pu-lo-step" aria-label="Data step">Data</span>
          <span className="pu-lo-step" aria-label="Ready step">Ready</span>
        </div>

        {/* Rotating loading messages */}
        <div className="pu-lo-msgs">
          <span className="pu-lo-msg">Preparing your workspace...</span>
          <span className="pu-lo-msg">Loading resources...</span>
          <span className="pu-lo-msg">Setting things up...</span>
          <span className="pu-lo-msg">Almost ready...</span>
        </div>

        {/* Welcome back section */}
        <div className="pu-lo-welcome">
          <span className="pu-lo-welcome-wave">&#x1F44B;</span>
          <span className="pu-lo-welcome-text">Welcome back, Student</span>
          <span className="pu-lo-welcome-sub">Your academic hub is ready</span>
        </div>

        {/* Subtle footer info */}
        <p className="pu-lo-footer">
          Prime University &mdash; Academic Learning Resource Management System
        </p>
      </div>
    </div>
  );
}
