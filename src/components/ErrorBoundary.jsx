import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#151515] text-white p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
            <p className="text-gray-400 text-sm">
              {this.state.error?.message || "L'application a rencontré un problème inattendu."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0055ff] text-white rounded-xl font-bold text-sm hover:bg-[#0044cc] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
