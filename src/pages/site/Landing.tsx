// ============================================================
// src/pages/site/Landing.tsx
// Home do site de marketing — Soccer Squad · Copa 2026
// ============================================================
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Radio, Trophy, Swords, BarChart3, Wallet, MapPin,
  QrCode, Users, CalendarCheck, ChevronRight, Play,
} from "lucide-react";
import "@/styles/site.css";
import { SiteHeader, SiteFooter } from "@/components/site/SiteLayout";
import { ColorBand, SiteSEO, useReveal, useSiteStats, nf } from "@/components/site/shared";

/* ---------- dados de apresentação ---------- */
const FEATURES = [
  {
    icon: Radio, title: "Partida ao vivo",
    text: "Placar em tempo real, check-in por QR code e súmula digital. Quem não foi, acompanha.",
    soft: "var(--ss-brand-soft)", deep: "var(--ss-brand)",
  },
  {
    icon: Trophy, title: "Torneios completos",
    text: "Crie a sua própria Copa: chaveamento automático, fases eliminatórias e final com gostinho de Mundial.",
    soft: "var(--ss-royal-soft)", deep: "var(--ss-royal)",
  },
  {
    icon: Swords, title: "Desafios entre times",
    text: "Matchmaking por nível e região. Encontre adversários à altura e marque amistosos de verdade.",
    soft: "var(--ss-coral-soft)", deep: "var(--ss-coral-deep)",
  },
  {
    icon: BarChart3, title: "Estatísticas de craque",
    text: "Gols, assistências, presença e nota por partida. Seu futebol vira videogame na vida real.",
    soft: "var(--ss-amber-soft)", deep: "var(--ss-amber-deep)",
  },
  {
    icon: Wallet, title: "Financeiro sem briga",
    text: "Mensalidades, lembretes automáticos por WhatsApp e caixa transparente para todo o elenco.",
    soft: "var(--ss-lime-soft)", deep: "var(--ss-lime-deep)",
  },
  {
    icon: MapPin, title: "Quadras perto de você",
    text: "Encontre o palco do próximo jogo entre as quadras parceiras da sua região.",
    soft: "var(--ss-royal-soft)", deep: "var(--ss-royal)",
  },
];

const STEPS = [
  { icon: Users, title: "Crie seu time", text: "Monte o elenco em minutos e convide pelo WhatsApp. Cada jogador tem perfil e posição." },
  { icon: CalendarCheck, title: "Convoque e sorteie", text: "Confirme presenças, sorteie times equilibrados e visualize a escalação no campinho." },
  { icon: Trophy, title: "Jogue e suba no ranking", text: "Registre o placar ao vivo, some estatísticas e dispute torneios e desafios." },
];

const FAQ = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Soccer Squad funciona direto no navegador do celular ou do computador, como um aplicativo (PWA). Você pode adicionar à tela inicial com um toque — sem ocupar memória e sem loja de aplicativos.",
  },
  {
    q: "Quanto custa?",
    a: "O time testa grátis. Depois, a assinatura é R$ 59,90 por mês por time — ou R$ 646,92 no plano anual (sai por R$ 53,91/mês, uma economia de R$ 71,88). Um valor só para o time inteiro, não por jogador.",
  },
  {
    q: "Como funcionam os desafios contra outros times?",
    a: "Você encontra adversários por nível e região no matchmaking. Ao confirmar um jogo contra outro time, cada equipe paga uma taxa de R$ 10 — isso garante compromisso dos dois lados e reduz furo.",
  },
  {
    q: "Funciona sem internet na quadra?",
    a: "Sim. O app guarda suas ações offline e sincroniza tudo automaticamente quando a conexão volta.",
  },
  {
    q: "Meus dados estão protegidos?",
    a: "Sim. Seguimos a LGPD, seus dados ficam criptografados e cada time só enxerga as próprias informações.",
  },
];

const MARQUEE = [
  "Copa do Bairro", "Liga da Firma", "Champions da Quebrada", "Torneio de Sábado",
  "Copa entre Amigos", "Mundialito da Rua", "Brasileirão da Pelada", "Copa da Resenha",
];

export default function Landing() {
  useReveal();
  const stats = useSiteStats();

  return (
    <div className="ss-site min-h-screen">
      <SiteSEO
        title="Soccer Squad — O clube digital do futebol amador | Organize peladas, torneios e desafios"
        description="Monte seu time, sorteie escalações equilibradas, registre o placar ao vivo, crie torneios com chaveamento e controle o financeiro. Teste grátis, sem instalar nada."
        path="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question", name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}</script>
      </Helmet>

      <SiteHeader />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-24 grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ss-amber-soft)] px-4 py-1.5 text-[var(--ss-amber-deep)] ss-eyebrow">
              ⚽ Especial Copa 2026
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-black leading-[1.05]">
              O mundo joga a Copa.
              <br />
              <span className="text-[var(--ss-brand)]">Você joga a sua.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[var(--ss-ink)]/70 leading-relaxed">
              Elenco, escalação, placar ao vivo, torneios, financeiro e estatísticas.
              O clube digital completo para o seu time de futebol amador.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/onboarding"
                className="rounded-full bg-[var(--ss-brand)] px-7 py-3.5 text-base font-semibold text-white hover:bg-[var(--ss-brand-vivid)] transition-colors"
              >
                Começar grátis agora
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ss-ink)]/15 px-6 py-3.5 text-base font-semibold hover:border-[var(--ss-ink)]/40 transition-colors"
              >
                <Play className="h-4 w-4" aria-hidden="true" /> Ver o app em 30s
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--ss-ink)]/50">
              Funciona no navegador, sem instalar · iOS, Android e computador
            </p>
          </div>

          {/* Escalação ao vivo: o objeto-herói */}
          <div className="ss-sheet mx-auto w-full max-w-sm rounded-2xl border border-black/8 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(15,110,86,0.35)]">
            <div className="flex items-center justify-between">
              <p className="ss-display font-extrabold text-sm">Real Quebrada × Juventus da Vila</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ss-coral-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--ss-coral-deep)]">
                <span className="ss-live-dot h-2 w-2 rounded-full bg-[var(--ss-coral)]" aria-hidden="true" />
                AO VIVO
              </span>
            </div>
            <p className="mt-3 ss-display text-5xl font-black tracking-tight">
              3 <span className="text-[var(--ss-ink)]/30">×</span> 2
            </p>
            <p className="text-xs text-[var(--ss-ink)]/50 mt-1">2º tempo · 18 min</p>
            <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
              <p className="flex justify-between"><span>⚽ Gol — Pedrão</span><span className="text-[var(--ss-ink)]/40">38'</span></p>
              <p className="flex justify-between"><span>🅰️ Assistência — Lucas 10</span><span className="text-[var(--ss-ink)]/40">38'</span></p>
              <p className="flex justify-between"><span>🟨 Amarelo — Zé do Gás</span><span className="text-[var(--ss-ink)]/40">31'</span></p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--ss-brand-soft)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--ss-brand)]">Check-in da galera</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--ss-brand)]">
                <QrCode className="h-4 w-4" aria-hidden="true" /> 14/16
              </span>
            </div>
          </div>
        </div>

        {/* Marquee de torneios: a Copa de cada um */}
        <div className="border-y border-black/5 bg-white py-3 ss-marquee" aria-hidden="true">
          <div className="ss-marquee-track ss-eyebrow text-[var(--ss-ink)]/40">
            {[...MARQUEE, ...MARQUEE].map((name, i) => (
              <span key={i} className="inline-flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ss-brand-vivid)]" /> {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROVA SOCIAL VIVA ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: stats.games, label: "partidas organizadas", soft: "var(--ss-brand-soft)", deep: "var(--ss-brand)" },
            { n: stats.teams, label: "times ativos", soft: "var(--ss-royal-soft)", deep: "var(--ss-royal)" },
            { n: stats.tournaments, label: "torneios em andamento", soft: "var(--ss-amber-soft)", deep: "var(--ss-amber-deep)" },
          ].map((s) => (
            <div key={s.label} className="ss-reveal rounded-2xl p-6 text-center" style={{ background: s.soft }}>
              <p className="ss-display text-4xl font-black" style={{ color: s.deep }}>{nf.format(s.n)}</p>
              <p className="mt-1 text-sm font-medium" style={{ color: s.deep }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-20" id="funcionalidades">
        <div className="ss-reveal max-w-2xl">
          <ColorBand thin />
          <h2 className="mt-4 text-3xl md:text-4xl font-black">Cada cor, uma arma do seu time</h2>
          <p className="mt-3 text-[var(--ss-ink)]/70">
            Enquanto outros apps só marcam a pelada, o Soccer Squad estrutura o clube inteiro.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="ss-reveal rounded-2xl p-6" style={{ background: f.soft }}>
              <f.icon className="h-7 w-7" style={{ color: f.deep }} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-extrabold" style={{ color: f.deep }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: f.deep }}>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="bg-[var(--ss-ink)] text-white" id="como-funciona">
        <ColorBand />
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="ss-reveal max-w-2xl">
            <p className="ss-eyebrow text-[var(--ss-lime)]">Do vestiário ao apito final</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">Em campo em três toques</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="ss-reveal">
                <div className="flex items-center gap-4">
                  <span className="ss-display text-5xl font-black text-white/15">{i + 1}</span>
                  <s.icon className="h-7 w-7 text-[var(--ss-lime)]" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold">{s.title}</h3>
                <p className="mt-2 text-white/65 leading-relaxed text-sm">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="ss-reveal mt-12 aspect-video w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            {/* Substituir pelo embed do vídeo demo de 30s quando produzido */}
            <div className="text-center">
              <Play className="mx-auto h-12 w-12 text-[var(--ss-lime)]" aria-hidden="true" />
              <p className="mt-3 text-white/60 text-sm">Vídeo demo: criar partida → convocar → sortear → placar ao vivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CAMPANHA COPA 2026 ============ */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="ss-reveal overflow-hidden rounded-3xl bg-[var(--ss-brand-soft)]">
          <div className="grid items-center gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
            <div>
              <p className="ss-eyebrow text-[var(--ss-brand)]">Promoção válida durante o Mundial</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-black text-[var(--ss-ink)]">
                Monte a sua Copa 2026
              </h2>
              <p className="mt-3 max-w-lg text-[var(--ss-brand)] leading-relaxed">
                48 seleções disputam o Mundial. Milhares de times disputam o Soccer Squad.
                Crie um torneio com os seus amigos durante a Copa e ganhe <strong>30 dias grátis</strong> de plano completo.
              </p>
              <Link
                to="/site/torneios"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ss-brand)] px-7 py-3.5 font-semibold text-white hover:bg-[var(--ss-brand-vivid)] transition-colors"
              >
                Criar meu torneio <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="hidden md:flex flex-col gap-2">
              {["Oitavas", "Quartas", "Semi", "A GRANDE FINAL"].map((fase, i) => (
                <div
                  key={fase}
                  className="rounded-xl bg-white px-5 py-3 ss-display font-extrabold text-sm"
                  style={{ marginLeft: `${i * 18}px`, color: i === 3 ? "var(--ss-coral-deep)" : "var(--ss-ink)" }}
                >
                  {fase}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="ss-reveal text-3xl font-black">Quem joga, aprova</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {/* TODO: substituir por depoimentos reais de usuários beta */}
          {[
            { quote: "Acabou a planilha e o grupo de figurinha. Sorteio justo e ninguém mais reclama do time.", name: "Organizador · Pelada de quinta", color: "var(--ss-brand)" },
            { quote: "O placar ao vivo mudou tudo. Quem não vai, acompanha. Quem vai, quer aparecer na estatística.", name: "Capitão · Society de sábado", color: "var(--ss-royal)" },
            { quote: "Cobrar mensalidade era constrangedor. Agora o app lembra por mim e o caixa é transparente.", name: "Tesoureiro · Liga da firma", color: "var(--ss-coral-deep)" },
          ].map((t) => (
            <figure key={t.name} className="ss-reveal rounded-2xl border border-black/8 bg-white p-6">
              <blockquote className="text-[15px] leading-relaxed text-[var(--ss-ink)]/80">"{t.quote}"</blockquote>
              <figcaption className="mt-4 text-sm font-semibold" style={{ color: t.color }}>{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ============ PREÇO ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="ss-reveal grid items-center gap-8 rounded-3xl border border-black/8 bg-white p-8 md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <p className="ss-eyebrow text-[var(--ss-brand)]">Um preço para o time inteiro</p>
            <h2 className="mt-3 text-3xl font-black">
              Teste grátis. Depois, <span className="text-[var(--ss-brand)]">R$ 59,90/mês</span> por time.
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ss-ink)]/70">
              Não é por jogador: é um valor único para o clube todo. No plano anual sai por
              R$ 53,91/mês — economia de R$ 71,88. Cancele quando quiser.
            </p>
          </div>
          <Link
            to="/site/planos"
            className="rounded-full bg-[var(--ss-ink)] px-8 py-4 text-center font-semibold text-white hover:bg-black transition-colors"
          >
            Ver planos completos
          </Link>
        </div>
      </section>

      {/* ============ B2B QUADRAS ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="ss-reveal flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-[var(--ss-amber-soft)] p-8 md:p-10">
          <div>
            <h2 className="text-2xl font-black text-[var(--ss-amber-deep)]">Tem uma quadra ou arena?</h2>
            <p className="mt-2 max-w-xl text-[var(--ss-amber-deep)]">
              Receba times do Soccer Squad e ocupe seus horários vagos. Cadastro gratuito para parceiros.
            </p>
          </div>
          <Link
            to="/site/quadras"
            className="rounded-full bg-[var(--ss-amber-deep)] px-7 py-3.5 font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Quero ser parceiro
          </Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto max-w-3xl px-4 pb-24" id="faq">
        <h2 className="ss-reveal text-3xl font-black text-center">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="ss-reveal group rounded-2xl border border-black/8 bg-white px-6 py-4">
              <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-4">
                {f.q}
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ss-brand)] transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-[var(--ss-ink)]/70 leading-relaxed text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="bg-[var(--ss-brand)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="ss-reveal text-3xl md:text-5xl font-black">Falta o seu time.</h2>
          <p className="ss-reveal mt-4 text-white/80 max-w-xl mx-auto">
            Crie seu elenco agora e faça o primeiro sorteio em menos de cinco minutos. Grátis para começar.
          </p>
          <Link
            to="/onboarding"
            className="ss-reveal mt-8 inline-block rounded-full bg-white px-9 py-4 text-lg font-bold text-[var(--ss-brand)] hover:bg-[var(--ss-lime-soft)] transition-colors"
          >
            Criar meu time grátis
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
