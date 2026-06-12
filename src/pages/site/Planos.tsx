// ============================================================
// src/pages/site/Planos.tsx
// Planos e preços — espelha os valores do app (PricingPlans)
// ============================================================
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import "@/styles/site.css";
import { SiteHeader, SiteFooter } from "@/components/site/SiteLayout";
import { SiteSEO, useReveal } from "@/components/site/shared";

const RECURSOS = [
  "Jogadores e times ilimitados",
  "Sorteio equilibrado e escalação visual",
  "Placar ao vivo com check-in por QR code",
  "Torneios com chaveamento automático",
  "Matchmaking e desafios entre times",
  "Estatísticas, rankings e presença",
  "Financeiro completo com lembretes por WhatsApp",
  "Funciona offline e sincroniza sozinho",
];

export default function Planos() {
  useReveal();
  return (
    <div className="ss-site min-h-screen">
      <SiteSEO
        title="Planos e preços | Soccer Squad — R$ 59,90/mês por time"
        description="Teste grátis. Depois R$ 59,90/mês por time, ou R$ 646,92/ano (10% de desconto). Um valor único para o clube inteiro, com todos os recursos."
        path="/site/planos"
      />
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-black">Um preço. O time inteiro.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--ss-ink)]/65">
          Sem cobrança por jogador, sem recursos escondidos. Teste grátis e assine quando o time aprovar.
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
          {/* Mensal */}
          <div className="ss-reveal rounded-3xl border border-black/10 bg-white p-8 text-left">
            <p className="ss-eyebrow text-[var(--ss-ink)]/50">Mensal</p>
            <p className="mt-3 ss-display text-4xl font-black">R$ 59,90<span className="text-base font-semibold text-[var(--ss-ink)]/45">/mês</span></p>
            <p className="mt-1 text-sm text-[var(--ss-ink)]/55">por time, com tudo incluído</p>
            <Link to="/pricing" className="mt-6 block rounded-full border border-[var(--ss-ink)]/15 py-3.5 text-center font-semibold hover:border-[var(--ss-ink)]/40 transition-colors">
              Começar teste grátis
            </Link>
          </div>

          {/* Anual — destaque */}
          <div className="ss-reveal relative rounded-3xl border-2 border-[var(--ss-brand)] bg-white p-8 text-left">
            <span className="absolute -top-3.5 left-8 rounded-full bg-[var(--ss-brand)] px-4 py-1 text-xs font-bold text-white">
              MAIS ESCOLHIDO · ECONOMIZE R$ 71,88
            </span>
            <p className="ss-eyebrow text-[var(--ss-brand)]">Anual</p>
            <p className="mt-3 ss-display text-4xl font-black">R$ 53,91<span className="text-base font-semibold text-[var(--ss-ink)]/45">/mês</span></p>
            <p className="mt-1 text-sm text-[var(--ss-ink)]/55">R$ 646,92 cobrados por ano (10% off)</p>
            <Link to="/pricing" className="mt-6 block rounded-full bg-[var(--ss-brand)] py-3.5 text-center font-semibold text-white hover:bg-[var(--ss-brand-vivid)] transition-colors">
              Assinar plano anual
            </Link>
          </div>
        </div>

        <div className="ss-reveal mx-auto mt-12 max-w-3xl rounded-3xl bg-[var(--ss-brand-soft)] p-8 text-left">
          <p className="font-extrabold text-[var(--ss-brand)]">Tudo isso, nos dois planos:</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {RECURSOS.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-[var(--ss-brand)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
        </div>

        <p className="ss-reveal mx-auto mt-8 max-w-xl text-sm text-[var(--ss-ink)]/55">
          Desafios contra outros times têm taxa de R$ 10 por equipe na confirmação do jogo —
          garantia de compromisso dos dois lados. Cancele sua assinatura quando quiser, sem multa.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
