// ============================================================
// src/components/onboarding/SearchingScreen.tsx
// Tela B.3.4 — Loading animado enquanto busca times
// ============================================================

import { useEffect, useState } from "react";

const MESSAGES = [
  "Procurando times na sua região...",
  "Verificando jogos disponíveis...",
  "Analisando compatibilidade de horários...",
  "Calculando distâncias...",
  "Encontrando as melhores opções para você...",
];

export function SearchingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8 py-8">
      {/* Radar animation */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {[1, 2, 3].map(i => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"
            style={{ animationDelay: `${i * 0.4}s`, animationDuration: "2s" }}
          />
        ))}
        <div className="relative z-10 w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-4xl shadow-lg">
          ⚽
        </div>
      </div>

      {/* Rotating message */}
      <div className="text-center space-y-2 min-h-[3rem]">
        <p className="font-semibold text-base transition-opacity duration-500">
          {MESSAGES[msgIdx]}
        </p>
        <p className="text-sm text-muted-foreground">Buscando em até 5km de você</p>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
