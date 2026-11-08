import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'katex/dist/katex.min.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Study Better Error caught by boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '48px auto', background: '#fff', borderRadius: '24px', border: '1px solid #e9d5ff', boxShadow: '0 20px 25px -5px rgba(107, 33, 168, 0.08)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
            🎓
          </div>
          <h2 style={{ color: '#581c87', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>Study Better · University Portal Notice</h2>
          <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            A client-side initialization state needs to be refreshed. Click below to reset your local session:
          </p>
          <pre style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '12px', borderRadius: '12px', color: '#6b21a8', fontSize: '11px', overflowX: 'auto', marginBottom: '20px' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}
          >
            Clear Local Session & Reconnect
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
