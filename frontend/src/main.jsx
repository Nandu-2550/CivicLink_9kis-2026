import { StrictMode } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif',
          background: '#050505',
          color: '#fff',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            ⚠️ Application Error
          </h1>
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Error Details:</h3>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#b0c4de' }}>
              Component Stack Trace (click to expand)
            </summary>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              lineHeight: '1.5',
              maxHeight: '400px'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#b0c4de',
              color: '#050505',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Reload Application
          </button>
          <p style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
            If this error persists, please check the browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("🚀 CivicLink app starting...");
console.log("React version:", React.version);

// Diagnostic: Check if all imports loaded
console.log("Checking imports...");
try {
  console.log("✅ React imported:", React);
  console.log("✅ createRoot imported:", createRoot);
} catch (e) {
  console.error("❌ Import error:", e);
}

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: system-ui; background: #050505; color: #fff;">
        <h1 style="color: #ff6b6b;">Critical Error</h1>
        <p>Root DOM element (#root) not found. Check index.html</p>
      </div>
    `;
  } else {
    console.log("✅ Root element found");
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log("✅ App rendered successfully");
  }
} catch (error) {
  console.error("❌ Fatal error during app initialization:", error);
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: system-ui; background: #050505; color: #fff; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #ff6b6b;">⚠️ Fatal Application Error</h1>
      <p style="color: #888;">The application failed to start. Please check the console for details.</p>
      <pre style="background: rgba(255,0,0,0.1); padding: 20px; border-radius: 8px; overflow: auto; color: #ff6b6b;">
        ${error.message}
      </pre>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background: #b0c4de; color: #050505; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; margin-top: 20px;">
        🔄 Reload Application
      </button>
    </div>
  `;
}

