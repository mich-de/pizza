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
        /* Schermata di guasto: non si stampa, e non porta il rosso addosso —
           il rosso e' del pulsante che agisce, qui l'azione e' ricaricare. */
        <div className="min-h-screen flex items-center justify-center p-6 no-print">
          <div className="card card-accent w-full max-w-md">
            <span className="eyebrow">{t('common.error')}</span>
            <h1 className="mt-1">{t('errorBoundary.unexpected')}</h1>
            <div className="alert alert-error mb-5">
              <span className="material-symbols-outlined text-base leading-none">error</span>
              <span>{t('errorBoundary.unexpectedDesc')}</span>
            </div>
            <button onClick={() => window.location.reload()} className="btn btn-primary btn-block">
              <span className="material-symbols-outlined text-base">refresh</span>
              {t('errorBoundary.reloadPage')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
