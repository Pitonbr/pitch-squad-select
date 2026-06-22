import { useState, useCallback } from "react";

interface Player { name: string; rating: number }
interface Team { players: Player[]; total: number }

const COLORS = [
  { bg: "#e1f5ee", text: "#0f6e56", name: "Time A" },
  { bg: "#faece7", text: "#993c1d", name: "Time B" },
  { bg: "#e6f1fb", text: "#185fa5", name: "Time C" },
  { bg: "#faeeda", text: "#854f0b", name: "Time D" },
];

function balanced(players: Player[], n: number): Team[] {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const teams: Team[] = Array.from({ length: n }, () => ({ players: [], total: 0 }));
  for (const p of sorted) {
    const w = teams.reduce((m, t) => (t.total < m.total ? t : m), teams[0]);
    w.players.push(p);
    w.total += p.rating;
  }
  return teams;
}

function random(players: Player[], n: number): Team[] {
  const s = [...players].sort(() => Math.random() - 0.5);
  const teams: Team[] = Array.from({ length: n }, () => ({ players: [], total: 0 }));
  s.forEach((p, i) => { const t = teams[i % n]; t.players.push(p); t.total += p.rating; });
  return teams;
}

export default function SorteioTool() {
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 10 }, () => ({ name: "", rating: 3 }))
  );
  const [numTeams, setNumTeams] = useState(2);
  const [mode, setMode] = useState<"balanced" | "random">("balanced");
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (i: number, f: keyof Player, v: string | number) =>
    setPlayers((p) => p.map((x, idx) => (idx === i ? { ...x, [f]: v } : x)));

  const doSort = () => {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < numTeams * 2) return;
    setTeams((mode === "balanced" ? balanced : random)(valid, numTeams));
  };

  const fmt = useCallback(() => {
    if (!teams) return "";
    return teams
      .map((t, i) => `⚽ ${COLORS[i]?.name ?? `Time ${i + 1}`}: ${t.players.map((p) => p.name).join(", ")} (média ${(t.total / t.players.length).toFixed(1)})`)
      .join("\n");
  }, [teams]);

  const copy = async () => {
    await navigator.clipboard.writeText(fmt() + "\n\n🏟️ soccersquad.com.br/sorteio");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Times:</span>
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={() => setNumTeams(n)}
              className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${numTeams === n ? "bg-[#0f6e56] text-white" : "bg-[#e1f5ee] text-[#0f6e56]"}`}>{n}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Modo:</span>
          {(["balanced", "random"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === m ? "bg-[#0f6e56] text-white" : "bg-[#e1f5ee] text-[#0f6e56]"}`}>
              {m === "balanced" ? "Equilibrado" : "Aleatório"}
            </button>
          ))}
        </div>
      </div>

      {/* Jogadores */}
      <div className="mt-6 space-y-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-xs text-black/30 text-right">{i + 1}</span>
            <input placeholder={`Jogador ${i + 1}`} value={p.name} onChange={(e) => update(i, "name", e.target.value)}
              className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm" />
            <span className="text-xs text-black/40 w-8">Nota</span>
            <input type="range" min={1} max={5} step={1} value={p.rating}
              onChange={(e) => update(i, "rating", Number(e.target.value))} className="w-20" />
            <span className="w-5 text-sm font-bold text-[#0f6e56]">{p.rating}</span>
            {players.length > 4 && (
              <button onClick={() => setPlayers((p) => p.filter((_, idx) => idx !== i))}
                className="p-1 text-black/30 hover:text-red-500">✕</button>
            )}
          </div>
        ))}
        <button onClick={() => setPlayers((p) => [...p, { name: "", rating: 3 }])}
          className="text-sm font-medium text-[#0f6e56] hover:underline">+ Adicionar jogador</button>
      </div>

      <button onClick={doSort}
        className="mt-6 w-full rounded-full bg-[#0f6e56] py-4 text-lg font-bold text-white hover:bg-[#1d9e75] transition-colors">
        🔀 Sortear times
      </button>

      {/* Resultado */}
      {teams && (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numTeams}, 1fr)` }}>
            {teams.map((t, i) => {
              const c = COLORS[i] ?? COLORS[0];
              return (
                <div key={i} className="rounded-2xl p-5" style={{ background: c.bg }}>
                  <p className="font-extrabold" style={{ color: c.text, fontFamily: '"Archivo",system-ui,sans-serif' }}>{c.name}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: c.text }}>Média: {(t.total / t.players.length).toFixed(1)} ★</p>
                  <ul className="mt-3 space-y-1">
                    {t.players.map((p) => (
                      <li key={p.name} className="flex justify-between text-sm" style={{ color: c.text }}>
                        <span>{p.name}</span><span className="opacity-60">{p.rating}★</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={copy} className="flex-1 rounded-full border border-black/15 py-3 text-sm font-semibold hover:bg-black/5 transition-colors">
              {copied ? "✓ Copiado!" : "📋 Copiar resultado"}
            </button>
            <button onClick={doSort} className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold hover:bg-black/5 transition-colors">
              🔀 Sortear de novo
            </button>
          </div>

          <div className="rounded-2xl bg-[#e1f5ee] p-6 text-center">
            <p className="font-extrabold text-[#0f6e56]">Gostou? No app é ainda melhor.</p>
            <p className="mt-1 text-sm text-[#0f6e56]">Salve o elenco, confirme presença, sorteie e registre o placar ao vivo.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a href="https://apps.apple.com/br/app/soccer-squad/id0000000000"
                className="rounded-xl bg-[#0a1b14] px-5 py-3 text-white text-sm font-semibold">App Store</a>
              <a href="https://play.google.com/store/apps/details?id=com.soccersquad.app"
                className="rounded-xl bg-[#0a1b14] px-5 py-3 text-white text-sm font-semibold">Google Play</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
