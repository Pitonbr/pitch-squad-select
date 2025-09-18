import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substr(2, 9);
    console.error('ErrorBoundary: Error caught', { error: error.message, errorId });
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('ErrorBoundary: Full error details', errorDetails);
    
    // Store error for debugging
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastError', JSON.stringify(errorDetails));
    }
    
    this.setState({
      error,
      errorInfo,
      errorId: this.state.errorId
    });
  }

  handleReload = () => {
    // Clear cache before reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force reload without cache
    window.location.reload();
  };

  handleReset = () => {
    console.log('ErrorBoundary: Attempting reset');
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  handleClearCache = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear browser cache if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).then(() => {
        this.forceReload();
      });
    } else {
      this.forceReload();
    }
  };

  private forceReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Erro na Aplicação</CardTitle>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  ID do Erro: {this.state.errorId}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Ocorreu um erro inesperado. Tente as opções abaixo para resolver o problema.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-3 rounded-md text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <Bug className="h-3 w-3" />
                    <span className="font-semibold">Detalhes do Erro (Dev):</span>
                  </div>
                  <p className="font-mono break-all text-destructive">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Stack Trace</summary>
                      <pre className="mt-1 text-xs overflow-auto max-h-32 bg-background p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="grid gap-2">
                <Button onClick={this.handleReset} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={this.handleReload} variant="secondary" className="w-full">
                  Recarregar Página
                </Button>
                <Button onClick={this.handleClearCache} variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Limpar Cache e Recarregar
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Se o problema persistir, tente limpar o cache do navegador
                ou acesse a aplicação em uma aba anônima.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}