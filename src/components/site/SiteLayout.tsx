// ============================================================
// src/components/site/SiteLayout.tsx
// Header + Footer do site de marketing (mobile-first)
// ============================================================
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ColorBand } from "./shared";

const NAV = [
  { to: "/site/torneios", label: "Torneios" },
  { to: "/site/quadras", label: "Para quadras" },
  { to: "/site/rankings", label: "Rankings" },
  { to: "/site/planos", label: "Planos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-[var(--ss-paper)]/95 backdrop-blur border-b border-black/5">
      <ColorBand />
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/site" className="flex items-center gap-2.5" aria-label="Soccer Squad — início">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ss-brand)] text-white ss-display font-extrabold text-sm">
            SS
          </span>
          <span className="ss-display font-extrabold text-lg tracking-tight">Soccer Squad</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "text-[var(--ss-brand)]" : "text-[var(--ss-ink)]/70 hover:text-[var(--ss-ink)]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/auth"
            className="text-sm font-medium text-[var(--ss-ink)]/70 hover:text-[var(--ss-ink)] transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/onboarding"
            className="rounded-full bg-[var(--ss-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ss-brand-vivid)] transition-colors"
          >
            Começar grátis
          </Link>
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-black/5 bg-[var(--ss-paper)] px-4 py-4 flex flex-col gap-1" aria-label="Menu móvel">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium hover:bg-[var(--ss-brand-soft)]"
            >
              {item.label}
            </NavLink>
          ))}
          <Link to="/auth" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-[var(--ss-brand-soft)]">
            Entrar
          </Link>
          <Link
            to="/onboarding"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-[var(--ss-brand)] px-5 py-3 text-center text-base font-semibold text-white"
          >
            Começar grátis
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[var(--ss-ink)] text-white/80">
      <ColorBand />
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <p className="ss-display font-extrabold text-white text-lg">Soccer Squad</p>
          <p className="mt-2 text-sm leading-relaxed">
            O clube digital completo do futebol amador brasileiro.
          </p>
        </div>
        <nav aria-label="Produto" className="text-sm">
          <p className="ss-eyebrow text-[var(--ss-lime)] mb-3">Produto</p>
          <ul className="space-y-2">
            <li><Link to="/site/torneios" className="hover:text-white">Torneios</Link></li>
            <li><Link to="/site/rankings" className="hover:text-white">Rankings</Link></li>
            <li><Link to="/site/planos" className="hover:text-white">Planos e preços</Link></li>
            <li><Link to="/onboarding" className="hover:text-white">Criar meu time</Link></li>
          </ul>
        </nav>
        <nav aria-label="Parcerias" className="text-sm">
          <p className="ss-eyebrow text-[var(--ss-amber)] mb-3">Parcerias</p>
          <ul className="space-y-2">
            <li><Link to="/site/quadras" className="hover:text-white">Cadastre sua quadra</Link></li>
            <li><a href="mailto:contato@soccersquad.com.br" className="hover:text-white">Imprensa e mídia</a></li>
          </ul>
        </nav>
        <nav aria-label="Legal e redes" className="text-sm">
          <p className="ss-eyebrow text-[var(--ss-royal-vivid)] mb-3">Soccer Squad</p>
          <ul className="space-y-2">
            <li><a href="/termos" className="hover:text-white">Termos de uso</a></li>
            <li><a href="/privacidade" className="hover:text-white">Privacidade (LGPD)</a></li>
          </ul>
          <div className="mt-4 flex gap-4 text-sm">
            <a href="https://instagram.com/soccersquadbr" aria-label="Instagram" className="hover:text-white">Instagram</a>
            <a href="https://tiktok.com/@soccersquadbr" aria-label="TikTok" className="hover:text-white">TikTok</a>
            <a href="https://youtube.com/@soccersquadbr" aria-label="YouTube" className="hover:text-white">YouTube</a>
          </div>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © 2026 Soccer Squad · soccersquad.com.br · Feito no Brasil, para quem joga de verdade.
      </div>
    </footer>
  );
}
