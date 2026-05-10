import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
          <div className="bg-error-container border-4 border-error p-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] max-w-lg text-center">
            <span className="material-symbols-outlined text-5xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <h2 className="font-headline font-black uppercase text-2xl text-error mb-2">
              Qualcosa è andato storto
            </h2>
            <p className="font-body text-on-error-container mb-4">
              {this.state.error?.message || 'Errore sconosciuto'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-error text-on-error font-headline font-bold uppercase px-6 py-3 border-2 border-error shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-primary hover:text-on-primary transition-colors"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
