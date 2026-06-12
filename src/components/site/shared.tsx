// ============================================================
// src/components/site/shared.tsx
// Peças compartilhadas do site de marketing Soccer Squad
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Faixa 26: assinatura visual ---------- */
export function ColorBand({ thin = false }: { thin?: boolean }) {
  return (
    <div className={`ss-band ${thin ? "ss-band--thin" : ""}`} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

/* ---------- SEO por página (react-helmet-async) ---------- */
interface SeoProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
}
export function SiteSEO({ title, description, path = "/", type = "website" }: SeoProps) {
  const url = `https://soccersquad.com.br${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Soccer Squad" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:image" content="https://soccersquad.com.br/og-cover.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        name: "Soccer Squad",
        operatingSystem: "Web, iOS, Android",
        applicationCategory: "SportsApplication",
        description,
        url,
        offers: { "@type": "Offer", price: "59.90", priceCurrency: "BRL" },
      })}</script>
    </Helmet>
  );
}

/* ---------- Reveal on scroll ---------- */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".ss-reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("ss-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ---------- Estatísticas ao vivo (prova social que cresce sozinha) ----------
   Lê a função pública site_public_stats() no Supabase.
   Se a função ainda não existir, usa valores de fallback. */
export interface SiteStats {
  games: number;
  teams: number;
  tournaments: number;
}
const FALLBACK: SiteStats = { games: 2340, teams: 580, tournaments: 64 };

export function useSiteStats(): SiteStats {
  const [stats, setStats] = useState<SiteStats>(FALLBACK);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    supabase
      .rpc("site_public_stats")
      .then(({ data, error }) => {
        if (!error && data) {
          const d = Array.isArray(data) ? data[0] : data;
          if (d?.games_count != null) {
            setStats({
              games: Number(d.games_count),
              teams: Number(d.teams_count),
              tournaments: Number(d.tournaments_count),
            });
          }
        }
      });
  }, []);

  return stats;
}

export const nf = new Intl.NumberFormat("pt-BR");
