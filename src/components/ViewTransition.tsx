// ============================================================
// src/components/ViewTransition.tsx  — FASE 3
// Wrapper de transição suave entre views.
// Envolva cada view renderizada no Index.tsx para animação.
//
// Uso:
//   <ViewTransition viewKey={currentView}>
//     <Dashboard />
//   </ViewTransition>
// ============================================================

import { useEffect, useRef, useState } from "react";

interface ViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

export function ViewTransition({ viewKey, children }: ViewTransitionProps) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(viewKey);

  useEffect(() => {
    // Quando a key muda, re-dispara a animação
    if (prevKey.current !== viewKey) {
      setVisible(false);
      prevKey.current = viewKey;
      // Pequeno delay para o browser processar a remoção da classe
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(true);
    }
  }, [viewKey]);

  return (
    <div
      className={`transition-all duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {children}
    </div>
  );
}
