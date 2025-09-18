import React, { ReactNode, useEffect, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface SafeProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * SafeProvider - Enhanced provider that wraps children with error boundaries
 * and additional safety checks for React context issues
 */
export function SafeProvider({ children, fallback, onError }: SafeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure component is properly mounted before rendering children
    setMounted(true);

    // Add global error listeners
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('SafeProvider: Unhandled promise rejection:', event.reason);
      
      if (onError && event.reason instanceof Error) {
        onError(event.reason, { componentStack: 'Promise rejection' } as React.ErrorInfo);
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('SafeProvider: Unhandled error:', event.error);
      
      if (onError && event.error instanceof Error) {
        onError(event.error, { componentStack: 'Global error' } as React.ErrorInfo);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  // Don't render children until component is properly mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando aplicação...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

// Hook to detect React context errors
export function useErrorDetection() {
  useEffect(() => {
    // Check for common React errors
    const checkReactErrors = () => {
      // Check if React is properly loaded
      if (typeof React === 'undefined') {
        console.error('React is not properly loaded');
        return;
      }

      // Check for duplicate React instances
      const reactInstances = Object.keys(window).filter(key => key.includes('React'));
      if (reactInstances.length > 1) {
        console.warn('Multiple React instances detected:', reactInstances);
      }

      // Check for hook errors in console
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('Invalid hook call') || 
            message.includes('Cannot read properties of null')) {
          console.error('Hook error detected - attempting recovery');
          
          // Store error for debugging
          sessionStorage.setItem('reactHookError', JSON.stringify({
            message,
            timestamp: new Date().toISOString(),
            url: window.location.href
          }));
        }
        
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    };

    const cleanup = checkReactErrors();
    
    return cleanup;
  }, []);
}