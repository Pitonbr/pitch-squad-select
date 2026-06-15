import { Megaphone } from "lucide-react";

export default function AdminAnnouncements() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-cyan-400" />
          Comunicados
        </h1>
        <p className="text-slate-400 text-sm mt-1">Em construção — Fase 2 do painel admin.</p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-700 p-16 text-center">
        <Megaphone className="h-10 w-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Módulo de comunicados chegando em breve.</p>
      </div>
    </div>
  );
}
