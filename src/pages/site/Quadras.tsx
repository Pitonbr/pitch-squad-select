// ============================================================
// src/pages/site/Quadras.tsx
// Página B2B: captação de quadras e arenas parceiras
// Leads gravados na tabela public.partner_leads (ver migration)
// ============================================================
import { useState } from "react";
import { CalendarClock, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import "@/styles/site.css";
import { SiteHeader, SiteFooter } from "@/components/site/SiteLayout";
import { SiteSEO, useReveal } from "@/components/site/shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const BENEFICIOS = [
  { icon: CalendarClock, title: "Ocupe horários vagos", text: "Times do Soccer Squad procuram quadra toda semana. Apareça para quem está a minutos de fechar um jogo." },
  { icon: Users, title: "Cliente recorrente", text: "Pelada fixa é receita fixa. Times organizados voltam toda semana — não é cliente avulso." },
  { icon: TrendingUp, title: "Sem custo para começar", text: "O cadastro de parceiro é gratuito. Você só ganha visibilidade e demanda qualificada." },
];

export default function Quadras() {
  useReveal();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", venue: "", city: "", whatsapp: "", email: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.venue || !form.city || !form.whatsapp) {
      toast({ title: "Quase lá", description: "Preencha nome, quadra, cidade e WhatsApp para continuar." });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("partner_leads").insert({
      contact_name: form.name,
      venue_name: form.venue,
      city: form.city,
      whatsapp: form.whatsapp,
      email: form.email || null,
      source: "site",
    });
    setSending(false);
    if (error) {
      toast({ title: "Não foi possível enviar", description: "Tente de novo em instantes ou fale com a gente em contato@soccersquad.com.br." });
      return;
    }
    setDone(true);
  };

  return (
    <div className="ss-site min-h-screen">
      <SiteSEO
        title="Cadastre sua quadra ou arena | Parceiros Soccer Squad"
        description="Receba times de futebol amador organizados e ocupe os horários vagos da sua quadra. Cadastro de parceiro gratuito."
        path="/site/quadras"
      />
      <SiteHeader />

      <section className="bg-[var(--ss-amber-soft)]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="ss-eyebrow text-[var(--ss-amber-deep)]">Para donos de quadra e arena</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-black text-[var(--ss-ink)]">
              Horário vago é gol contra.
            </h1>
            <p className="mt-4 max-w-md text-lg text-[var(--ss-amber-deep)] leading-relaxed">
              Conecte sua quadra aos times do Soccer Squad e transforme janelas ociosas em peladas fixas, toda semana.
            </p>
            <ul className="mt-8 space-y-5">
              {BENEFICIOS.map((b) => (
                <li key={b.title} className="ss-reveal flex gap-4">
                  <b.icon className="h-6 w-6 shrink-0 text-[var(--ss-amber-deep)]" aria-hidden="true" />
                  <div>
                    <p className="font-extrabold text-[var(--ss-ink)]">{b.title}</p>
                    <p className="text-sm text-[var(--ss-amber-deep)]">{b.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Formulário de lead */}
          <div className="ss-reveal rounded-3xl border border-black/8 bg-white p-7 md:p-8">
            {done ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--ss-brand)]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">Cadastro recebido!</h2>
                <p className="mt-2 text-[var(--ss-ink)]/65">
                  Nossa equipe fala com você pelo WhatsApp em até 1 dia útil para ativar sua quadra.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">Cadastre sua quadra</h2>
                <p className="mt-1 text-sm text-[var(--ss-ink)]/55">Gratuito. Resposta em até 1 dia útil.</p>
                <div className="mt-6 space-y-4">
                  <Input placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Seu nome" />
                  <Input placeholder="Nome da quadra ou arena" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} aria-label="Nome da quadra ou arena" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Cidade / UF" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} aria-label="Cidade e UF" />
                    <Input placeholder="WhatsApp" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} aria-label="WhatsApp" />
                  </div>
                  <Input placeholder="E-mail (opcional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="E-mail (opcional)" />
                  <Button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="w-full rounded-full bg-[var(--ss-amber-deep)] py-6 text-base font-bold text-white hover:opacity-90"
                  >
                    {sending ? "Enviando..." : "Quero receber times"}
                  </Button>
                  <p className="text-xs text-[var(--ss-ink)]/45">
                    Ao enviar, você concorda em ser contatado pelo Soccer Squad. Dados tratados conforme a LGPD.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
