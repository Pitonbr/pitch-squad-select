// ============================================================
// src/pages/site/Torneios.tsx
// Página da campanha "Monte a sua Copa 2026"
// ============================================================
import { Link } from "react-router-dom";
import { Trophy, GitMerge, Medal, Share2, ChevronRight } from "lucide-react";
import "@/styles/site.css";
import { SiteHeader, SiteFooter } from "@/components/site/SiteLayout";
import { ColorBand, SiteSEO, useReveal } from "@/components/site/shared";

const PASSOS = [
  { icon: Trophy, title: "Dê nome à sua Copa", text: "Copa do Bairro, Liga da Firma, Mundialito da Rua — a taça é sua, o nome também." },
  { icon: GitMerge, title: "Chaveamento automático", text: "Adicione os times e o app monta o bracket: fase de grupos ou mata-mata direto." },
  { icon: Medal, title: "Jogos e classificação ao vivo", text: "Cada placar registrado atualiza o chaveamento e as estatísticas na hora." },
  { icon: Share2, title: "Compartilhe a glória", text: "Resultados e campeão prontos para postar no grupo e nas redes." },
];

export default function Torneios() {
  useReveal();
  return (
    <div className="ss-site min-h-screen">
      <SiteSEO
        title="Crie seu torneio de futebol amador com chaveamento automático | Soccer Squad"
        description="Monte a sua própria Copa: fase de grupos, mata-mata, classificação e placar ao vivo. Durante a Copa 2026, crie um torneio e ganhe 30 dias grátis."
        path="/site/torneios"
      />
      <SiteHeader />

      <section className="bg-[var(--ss-royal-soft)]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
          <span className="ss-eyebrow inline-block rounded-full bg-white px-4 py-1.5 text-[var(--ss-royal)]">
            Especial Copa 2026 · até 19 de julho
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-black text-[var(--ss-ink)]">
            A Copa deles tem 48 seleções.
            <br />
            <span className="text-[var(--ss-royal)]">A sua tem os seus amigos.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ss-royal)]">
            Crie um torneio no Soccer Squad durante o Mundial e ganhe 30 dias grátis do plano completo para o seu time.
          </p>
          <Link
            to="/onboarding"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--ss-royal)] px-8 py-4 text-lg font-bold text-white hover:bg-[var(--ss-royal-vivid)] transition-colors"
          >
            Criar meu torneio grátis <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <ColorBand />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="ss-reveal text-3xl font-black">Da primeira rodada à taça</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <article key={p.title} className="ss-reveal rounded-2xl border border-black/8 bg-white p-6">
              <span className="ss-display text-4xl font-black text-[var(--ss-royal-soft)]">{i + 1}</span>
              <p.icon className="mt-2 h-6 w-6 text-[var(--ss-royal)]" aria-hidden="true" />
              <h3 className="mt-3 font-extrabold">{p.title}</h3>
              <p className="mt-2 text-sm text-[var(--ss-ink)]/65 leading-relaxed">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Bracket ilustrativo */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="ss-reveal overflow-x-auto rounded-3xl bg-[var(--ss-ink)] p-8 md:p-12">
          <p className="ss-eyebrow text-[var(--ss-lime)]">Assim fica o seu chaveamento</p>
          <div className="mt-6 flex min-w-[560px] items-center gap-6 text-sm">
            <div className="flex flex-col gap-3">
              {["Real Quebrada", "Juventus da Vila", "Galáticos FC", "Unidos da Firma"].map((t) => (
                <div key={t} className="rounded-lg bg-white/10 px-4 py-2.5 font-semibold text-white">{t}</div>
              ))}
            </div>
            <div className="flex flex-col gap-10">
              {["Real Quebrada", "Galáticos FC"].map((t) => (
                <div key={t} className="rounded-lg bg-white/20 px-4 py-2.5 font-semibold text-white">{t}</div>
              ))}
            </div>
            <div className="rounded-lg bg-[var(--ss-amber)] px-5 py-3 ss-display font-black text-[var(--ss-ink)]">
              🏆 CAMPEÃO
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--ss-royal)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black">O apito inicial é seu.</h2>
          <Link
            to="/onboarding"
            className="mt-6 inline-block rounded-full bg-white px-8 py-4 font-bold text-[var(--ss-royal)] hover:bg-[var(--ss-royal-soft)] transition-colors"
          >
            Começar minha Copa 2026
          </Link>
          <p className="mt-3 text-sm text-white/70">Promoção válida para torneios criados até 19/07/2026.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
