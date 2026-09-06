import { Component } from 'react';

/**
 * Catches any unhandled JS errors in the React tree and shows a
 * friendly fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fcf8fa',
            fontFamily: 'Inter, sans-serif',
            padding: '24px',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1b1b1d', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#45464c', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 400 }}>
            The application encountered an unexpected error. Please refresh the page or contact support if the issue persists.
          </p>
          <details style={{ fontSize: 12, color: '#76777d', maxWidth: 560, wordBreak: 'break-all' }}>
            <summary style={{ cursor: 'pointer' }}>Error details</summary>
            <pre style={{ marginTop: 8 }}>{this.state.error?.toString()}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#1b1b1d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
