import React from 'react';

/**
 * ErrorBoundary — two modes:
 *
 * 1. Full-page (default): wraps an entire route, shows a full-screen error UI.
 * 2. Inline: pass a `fallback` prop (ReactNode) to render it instead when the
 *    subtree throws — useful for wrapping individual dashboard sections so one
 *    broken widget doesn't kill the entire page.
 *
 *    <ErrorBoundary fallback={<p>Stats unavailable</p>}>
 *      <StatCards />
 *    </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Intentionally not using console.error in production — errors are captured by Sentry
    if (process.env.NODE_ENV !== 'production') {
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Inline mode — render the caller-supplied fallback
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      const { section } = this.props;
      const label = section ? `${section} panel` : 'page';

      // Full-page mode
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Something went wrong{section ? ` in the ${label}` : ''}
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">
            {section
              ? `An unexpected error occurred. Please refresh to continue using the ${label}.`
              : 'An unexpected error occurred. Please go back to the home page and try again.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
