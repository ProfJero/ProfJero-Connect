import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/errorReporting';

/**
 * Last line of defence: a crash in any screen shows a friendly message
 * (instead of a blank page) and is reported to Monitoring.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-sm text-center">
          <img src="/icon-192.png" alt="" className="w-14 h-14 mx-auto rounded-xl" />
          <h1 className="mt-4 text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            This screen hit an unexpected error. It has been reported to our team. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-5 px-4 py-2 rounded-lg bg-[#1764e0] text-white text-sm font-semibold hover:bg-[#155cd0]"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
