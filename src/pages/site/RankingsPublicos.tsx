// ============================================================
// src/pages/site/RankingsPublicos.tsx
// Rankings públicos — SEO local + retorno recorrente ao site
// Lê site_public_rankings() (ver migration); fallback de exemplo
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import "@/styles/site.css";
import { SiteHeader, SiteFooter } from "@/components/site/SiteLayout";
import { SiteSEO, useReveal } from "@/components/site/shared";
import { supabase } from "@/integrations/supabase/client";

interface RankRow {
  team_name: string;
  city: string | null;
  wins: number;
  games: number;
}

const FALLBACK: RankRow[] = [
  { team_name: "Real Quebrada", city: "São Paulo · SP", wins: 14, games: 18 },
  { team_name: "Galáticos FC", city: "São Paulo · SP", wins: 12, games: 17 },
  { team_name: "Juventus da Vila", city: "Guarulhos · SP", wins: 11, games: 16 },
  { team_name: "Unidos da Firma", city: "Campinas · SP", wins: 10, games: 15 },
  { team_name: "Meia Boca FC", city: "Santo André · SP", wins: 9, games: 16 },
];

const MEDAL = ["var(--ss-amber)", "var(--ss-ink)", "var(--ss-coral)"];

export default function RankingsPublicos() {
  useReveal();
  const [rows, setRows] = useState<RankRow[]>(FALLBACK);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    supabase.rpc("site_public_rankings", { limit_rows: 10 }).then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length > 0) {
        setRows(data as RankRow[]);
        setIsLive(true);
      }
    });
  }, []);

  return (
    <div className="ss-site min-h-screen">
      <SiteSEO
        title="Ranking dos melhores times de futebol amador | Soccer Squad"
        description="Veja os times amadores que mais vencem no Soccer Squad. Crie o seu, dispute desafios e entre para o ranking da sua região."
        path="/site/rankings"
      />
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-4 py-16 md:py-20">
        <div className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-[var(--ss-amber)]" aria-hidden="true" />
          <h1 className="mt-4 text-4xl md:text-5xl font-black">Os donos da várzea</h1>
          <p className="mx-auto mt-3 max-w-lg text-[var(--ss-ink)]/65">
            Os times que mais vencem dentro do Soccer Squad.
            {!isLive && " (Dados de demonstração — o ranking oficial vai ao ar com os times reais da plataforma.)"}
          </p>
        </div>

        <ol className="mt-10 space-y-3">
          {rows.map((r, i) => (
            <li
              key={r.team_name}
              className="ss-reveal flex items-center gap-4 rounded-2xl border border-black/8 bg-white px-5 py-4"
            >
              <span
                className="ss-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
                style={{ background: MEDAL[i] ?? "var(--ss-brand)" }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{r.team_name}</p>
                {r.city && <p className="text-xs text-[var(--ss-ink)]/50">{r.city}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-[var(--ss-brand)]">{r.wins} vitórias</p>
                <p className="text-xs text-[var(--ss-ink)]/50">{r.games} jogos</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="ss-reveal mt-12 rounded-3xl bg-[var(--ss-brand-soft)] p-8 text-center">
          <h2 className="text-2xl font-black text-[var(--ss-ink)]">Acha que seu time joga mais?</h2>
          <p className="mt-2 text-[var(--ss-brand)]">Prove. Crie seu time, vença desafios e tome o topo.</p>
          <Link
            to="/onboarding"
            className="mt-5 inline-block rounded-full bg-[var(--ss-brand)] px-7 py-3.5 font-semibold text-white hover:bg-[var(--ss-brand-vivid)] transition-colors"
          >
            Entrar para o ranking
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
