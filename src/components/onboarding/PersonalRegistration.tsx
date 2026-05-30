// ============================================================
// src/components/onboarding/PersonalRegistration.tsx
// Cadastro pessoal em 3 mini-etapas com progresso no topo
// ============================================================

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, ChevronLeft, ChevronRight, Loader2, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonalData, FieldPosition, PreferredFoot } from "@/types/onboarding";
import { PositionSelector } from "./PositionSelector";

interface PersonalRegistrationProps {
  step: 1 | 2 | 3;
  initial?: Partial<PersonalData>;
  onNext: (data: Partial<PersonalData>) => void;
  onBack?: () => void;
}

export function PersonalRegistration({ step, initial = {}, onNext, onBack }: PersonalRegistrationProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Step 1 state
  const [fullName, setFullName]     = useState(initial.full_name ?? "");
  const [nickname, setNickname]     = useState(initial.nickname ?? "");
  const [photoUrl, setPhotoUrl]     = useState(initial.photo_url ?? "");
  const [birthDate, setBirthDate]   = useState(initial.birth_date ?? "");

  // Step 2 state
  const [jersey, setJersey]         = useState<string>(initial.jersey_number?.toString() ?? "");
  const [positions, setPositions]   = useState<FieldPosition[]>(initial.positions ?? []);
  const [foot, setFoot]             = useState<PreferredFoot | "">(initial.preferred_foot ?? "");

  // Step 3 state
  const [height, setHeight]         = useState<number>(initial.height_cm ?? 175);
  const [weight, setWeight]         = useState<number>(initial.weight_kg ?? 75);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `onboarding/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("player-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("player-images").getPublicUrl(path);
      setPhotoUrl(publicUrl);
    } catch {
      toast({ title: "Erro ao enviar foto", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || fullName.trim().length < 3) {
        toast({ title: "Nome obrigatório", description: "Informe seu nome completo.", variant: "destructive" }); return;
      }
      onNext({ full_name: fullName.trim(), nickname: nickname.trim(), photo_url: photoUrl || undefined, birth_date: birthDate || undefined });
    } else if (step === 2) {
      if (positions.length === 0) {
        toast({ title: "Posição obrigatória", description: "Selecione pelo menos uma posição.", variant: "destructive" }); return;
      }
      if (!foot) {
        toast({ title: "Pé preferido obrigatório", description: "Selecione seu pé preferido.", variant: "destructive" }); return;
      }
      onNext({ jersey_number: jersey ? parseInt(jersey) : undefined, positions, preferred_foot: foot });
    } else {
      onNext({ height_cm: height, weight_kg: weight });
    }
  };

  const STEP_LABELS = ["Quem é você?", "Seu perfil de jogador", "Dados físicos"];
  const progress = (step / 3) * 100;

  const initials = fullName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Etapa {step} de 3
          </p>
          <p className="text-xs text-muted-foreground">{STEP_LABELS[step - 1]}</p>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn("flex-1 h-0.5 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-border">
                <AvatarImage src={photoUrl} />
                <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <p className="text-xs text-muted-foreground">Foto opcional — seus colegas vão te reconhecer!</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo *</Label>
            <Input
              id="fullName"
              placeholder="Ex: Carlos Roberto da Silva"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido de jogador <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="nickname"
              placeholder="Ex: Ronaldinho, Gabigol, Tartaruga..."
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split("T")[0]}
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 80)).toISOString().split("T")[0]}
            />
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="jersey">Número de camisa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="jersey"
              type="number"
              min={1}
              max={99}
              placeholder="Seu número favorito (1–99)"
              value={jersey}
              onChange={e => setJersey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Posição em campo * <span className="text-muted-foreground text-xs">(até 2)</span></Label>
            <PositionSelector selected={positions} onChange={setPositions} />
          </div>

          <div className="space-y-2">
            <Label>Pé preferido *</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["right", "left"] as PreferredFoot[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFoot(f)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-semibold transition-all",
                    foot === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Footprints className="h-5 w-5" />
                  {f === "right" ? "👟 Direito" : "👟 Esquerdo"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esses dados ajudam na formação de times mais equilibrados. Ambos são opcionais.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Altura</Label>
              <span className="text-lg font-bold text-primary">{(height / 100).toFixed(2).replace(".", ",")} m</span>
            </div>
            <Slider
              min={150} max={210} step={1}
              value={[height]}
              onValueChange={([v]) => setHeight(v)}
              className="py-1"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>1,50 m</span><span>2,10 m</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Peso</Label>
              <span className="text-lg font-bold text-primary">{weight} kg</span>
            </div>
            <Slider
              min={50} max={130} step={1}
              value={[weight]}
              onValueChange={([v]) => setWeight(v)}
              className="py-1"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>50 kg</span><span>130 kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {onBack && (
          <Button type="button" variant="outline" className="gap-1" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />Voltar
          </Button>
        )}
        <Button className="flex-1 gap-1" onClick={handleNext}>
          {step === 3 ? "Criar meu perfil" : "Continuar"}
          {step < 3 && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
