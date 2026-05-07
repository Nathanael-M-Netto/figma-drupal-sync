/**
 * @file ErrorBoundary.jsx
 * Error boundary genérico para capturar erros de renderização React.
 *
 * Exibe uma mensagem amigável ao invés de quebrar o plugin inteiro.
 * Oferece botão de retry para recarregar o componente.
 */

import React from 'react';

export default class ErrorBoundary extends React.Component {
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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚠️</div>
          <h4>Algo deu errado</h4>
          <p className="error-boundary-msg">
            {this.state.error?.message || 'Erro inesperado na renderização.'}
          </p>
          <button className="btn btn-sm btn-outline" onClick={this.handleRetry}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
