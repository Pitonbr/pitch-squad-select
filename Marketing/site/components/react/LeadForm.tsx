import { useState } from "react";

export default function LeadForm() {
  const [form, setForm] = useState({ name: "", venue: "", city: "", whatsapp: "", email: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.venue || !form.city || !form.whatsapp) {
      setError("Preencha nome, quadra, cidade e WhatsApp.");
      return;
    }
    setError("");
    setSending(true);

    // POST para Supabase via REST API (sem SDK — site estático)
    // TODO: trocar pela URL e anon key reais do Supabase do Soccer Squad
    const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
    const SUPABASE_ANON = "YOUR_ANON_KEY";

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/partner_leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          contact_name: form.name,
          venue_name: form.venue,
          city: form.city,
          whatsapp: form.whatsapp,
          email: form.email || null,
          source: "site",
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Não foi possível enviar. Tente de novo ou fale pelo WhatsApp.");
    }
    setSending(false);
  };

  if (done) {
    return (
      <div className="py-10 text-center">
        <span className="text-4xl">✅</span>
        <h2 className="mt-4 text-2xl font-extrabold" style={{ fontFamily: '"Archivo",system-ui,sans-serif' }}>Cadastro recebido!</h2>
        <p className="mt-2 text-[#854f0b]">Nossa equipe fala com você pelo WhatsApp em até 1 dia útil.</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-extrabold" style={{ fontFamily: '"Archivo",system-ui,sans-serif' }}>Cadastre sua quadra</h2>
      <p className="mt-1 text-sm text-black/55">Gratuito. Resposta em até 1 dia útil.</p>
      <div className="mt-6 space-y-4">
        <input placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
        <input placeholder="Nome da quadra ou arena" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Cidade / UF" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
          <input placeholder="WhatsApp" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
        </div>
        <input placeholder="E-mail (opcional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={handleSubmit} disabled={sending}
          className="w-full rounded-full bg-[#854f0b] py-3.5 text-base font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
          {sending ? "Enviando..." : "Quero receber times"}
        </button>
        <div className="text-center">
          <a href="https://wa.me/5511999999999?text=Quero%20cadastrar%20minha%20quadra%20no%20Soccer%20Squad"
            target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#854f0b] hover:underline">
            Prefere falar pelo WhatsApp?
          </a>
        </div>
        <p className="text-xs text-black/45">Ao enviar, você concorda em ser contatado pelo Soccer Squad. Dados tratados conforme a LGPD.</p>
      </div>
    </>
  );
}
