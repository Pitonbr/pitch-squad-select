// ============================================================
// src/hooks/useDebounce.ts  — FASE 4
// Hook utilitário de debounce para buscas.
// Usado pelo TeamMatchmaking para não disparar query a cada tecla.
// ============================================================

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
