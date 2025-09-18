import { useEffect, useState, useCallback } from 'react';

interface ErrorRecoveryOptions {
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRecovery?: () => void;
}

/**
 * Hook for handling component-level error recovery
 */
export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    onError,
    onRecovery
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err: Error) => {
    console.error('Component error detected:', err);
    setError(err);
    
    if (onError) {
      onError(err);
    }

    // Store error details for debugging
    sessionStorage.setItem('lastComponentError', JSON.stringify({
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      attemptCount,
      url: window.location.href
    }));
  }, [onError, attemptCount]);

  const retry = useCallback(() => {
    if (attemptCount < retryAttempts) {
      setIsRetrying(true);
      setAttemptCount(prev => prev + 1);
      
      setTimeout(() => {
        setError(null);
        setIsRetrying(false);
        
        if (onRecovery) {
          onRecovery();
        }
        
        console.log(`Recovery attempt ${attemptCount + 1} completed`);
      }, retryDelay);
    } else {
      console.error('Max retry attempts reached');
    }
  }, [attemptCount, retryAttempts, retryDelay, onRecovery]);

  const reset = useCallback(() => {
    setError(null);
    setAttemptCount(0);
    setIsRetrying(false);
  }, []);

  // Auto-retry with exponential backoff
  useEffect(() => {
    if (error && attemptCount < retryAttempts && !isRetrying) {
      const timeout = setTimeout(() => {
        retry();
      }, retryDelay * Math.pow(2, attemptCount));

      return () => clearTimeout(timeout);
    }
  }, [error, attemptCount, retryAttempts, isRetrying, retry, retryDelay]);

  return {
    error,
    isRetrying,
    attemptCount,
    canRetry: attemptCount < retryAttempts,
    handleError,
    retry,
    reset
  };
}

/**
 * Hook for wrapping async operations with error recovery
 */
export function useSafeAsync<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, handleError, retry, reset } = useErrorRecovery();

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      reset();
      
      const result = await asyncFn();
      setData(result);
      
      return result;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    retry: () => {
      retry();
      execute();
    },
    reset: () => {
      reset();
      setData(null);
    }
  };
}