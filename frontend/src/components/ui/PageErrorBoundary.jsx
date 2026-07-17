import React from 'react';

/**
 * Empêche une erreur de rendu d'une page d'effacer toute l'application.
 */
class PageErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Erreur de rendu de page :', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-semibold">Impossible d’afficher cette page</h1>
          <p className="mt-2 text-sm">Actualisez la page. Si le problème persiste, consultez la console du navigateur.</p>
          <button
            type="button"
            className="mt-4 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            onClick={() => window.location.reload()}
          >
            Actualiser
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
