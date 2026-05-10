import { Component } from 'react';
import { I18nContext } from '../i18n/I18nContext';

export default class ErrorBoundary extends Component {
  static contextType = I18nContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    const t = this.context?.t || (k => k);

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
          <div className="bg-surface border border-outline-variant rounded-sm w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-outline-variant">
              <div className="w-12 h-12 bg-error rounded-sm flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-primary">{t('errorBoundary.unexpected')}</h1>
            </div>
            <div className="p-6">
              <p className="font-body text-sm text-on-surface-variant mb-6 leading-relaxed">
                {t('errorBoundary.unexpectedDesc')}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-on-primary font-label font-semibold tracking-wider px-6 py-3 rounded-sm hover:opacity-90 transition-opacity"
              >
                {t('errorBoundary.reloadPage')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
