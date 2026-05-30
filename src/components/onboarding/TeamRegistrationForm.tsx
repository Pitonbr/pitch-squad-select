// ============================================================
// src/components/onboarding/TeamRegistrationForm.tsx
// Tela B.4.1 — Cadastro do time (novo admin)
// ============================================================

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  GameType, DayOfWeek, TimeSlot,
  GAME_TYPE_INFO, DAY_LABELS, TIME_SLOT_INFO,
  BRAZIL_STATES,
} from "@/types/onboarding";

export interface TeamFormData {
  name: string;
  description?: string;
  logo_url?: string;
  state: string;
  city: string;
  neighborhood?: string;
  game_type: GameType;
  usual_days: DayOfWeek[];
  usual_time: TimeSlot;
  is_public: boolean;
  accepting_players: boolean;
}

interface TeamRegistrationFormProps {
  onSubmit: (data: TeamFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

const GAME_TYPES: GameType[] = ["campo", "society", "futsal", "beach"];
const DAYS: DayOfWeek[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const TIMES: TimeSlot[] = ["morning", "afternoon", "evening"];

export function TeamRegistrationForm({ onSubmit, onBack, loading = false }: TeamRegistrationFormProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [logoUrl, setLogoUrl]       = useState("");
  const [state, setState]           = useState("");
  const [city, setCity]             = useState("");
  const [hood, setHood]             = useState("");
  const [gameType, setGameType]     = useState<GameType | "">("");
  const [days, setDays]             = useState<DayOfWeek[]>([]);
  const [time, setTime]             = useState<TimeSlot | "">("");
  const [isPublic, setIsPublic]     = useState(true);

  const toggleDay = (d: DayOfWeek) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("team-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("team-logos").getPublicUrl(path);
      setLogoUrl(publicUrl);
    } catch {
      toast({ title: "Erro ao enviar logo", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Nome do time obrigatório", variant: "destructive" }); return;
    }
    if (!state || !city.trim()) {
      toast({ title: "Estado e cidade obrigatórios", variant: "destructive" }); return;
    }
    if (!gameType) {
      toast({ title: "Selecione o tipo de jogo", variant: "destructive" }); return;
    }
    if (days.length === 0) {
      toast({ title: "Selecione ao menos um dia", variant: "destructive" }); return;
    }
    if (!time) {
      toast({ title: "Selecione o horário habitual", variant: "destructive" }); return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      logo_url: logoUrl || undefined,
      state, city: city.trim(),
      neighborhood: hood.trim() || undefined,
      game_type: gameType,
      usual_days: days,
      usual_time: time,
      is_public: isPublic,
      accepting_players: isPublic,
    });
  };

  const initials = name.substring(0, 2).toUpperCase() || "⚽";

  return (
    <div className="w-full max-w-md mx-auto space-y-7">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Vamos montar seu time!</h2>
        <p className="text-sm text-muted-foreground">Você será o administrador e poderá convidar jogadores</p>
      </div>

      {/* ── Identidade ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identidade</p>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-border">
              <AvatarImage src={logoUrl} />
              <AvatarFallback className="text-xl font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="tname">Nome do time *</Label>
            <Input
              id="tname"
              placeholder="Ex: FC Paulistano"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tdesc">Descrição <span className="text-muted-foreground text-xs">(opcional, até 200 caracteres)</span></Label>
          <Textarea
            id="tdesc"
            placeholder="Conte um pouco sobre o time..."
            value={description}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
            rows={2}
          />
        </div>
      </section>

      {/* ── Localização ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Localização</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {BRAZIL_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tcity">Cidade *</Label>
            <Input id="tcity" placeholder="Ex: São Paulo" value={city} onChange={e => setCity(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="thood">Bairro <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input id="thood" placeholder="Ex: Vila Mariana" value={hood} onChange={e => setHood(e.target.value)} />
        </div>
      </section>

      {/* ── Formato ── */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formato e Horários</p>

        <div className="space-y-2">
          <Label>Tipo de jogo *</Label>
          <div className="grid grid-cols-2 gap-2">
            {GAME_TYPES.map(t => {
              const info = GAME_TYPE_INFO[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGameType(t)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
                    gameType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dias habituais *</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                  days.includes(d)
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Horário habitual *</Label>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map(s => {
              const info = TIME_SLOT_INFO[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm transition-all",
                    time === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span className="font-semibold text-xs">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Visibilidade ── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Visibilidade</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: true,  icon: <Unlock className="h-5 w-5" />, label: "Público", desc: "Qualquer jogador pode encontrar e solicitar entrada" },
            { val: false, icon: <Lock className="h-5 w-5" />,   label: "Privado", desc: "Apenas quem receber convite pode entrar" },
          ].map(opt => (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => setIsPublic(opt.val)}
              className={cn(
                "p-4 rounded-xl border-2 text-left space-y-1 transition-all",
                isPublic === opt.val
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className={cn("mb-1", isPublic === opt.val ? "text-primary" : "text-muted-foreground")}>
                {opt.icon}
              </div>
              <p className={cn("text-sm font-semibold", isPublic === opt.val ? "text-primary" : "text-foreground")}>
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={loading}>← Voltar</Button>
        <Button className="flex-1 gap-2 h-12 font-semibold" onClick={handleSubmit} disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</> : "🏆 Criar meu time"}
        </Button>
      </div>
    </div>
  );
}
