// ============================================================
// src/components/onboarding/TeamStepBasics.tsx
// Wizard de time — Etapa 1/5: Dados do grupo
// ============================================================

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, ChevronRight, Loader2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { GameType, TeamCategory, GAME_TYPE_INFO, TeamFormData } from "@/types/onboarding";
import { WizardProgress } from "./WizardProgress";

interface TeamStepBasicsProps {
  initial?: Partial<TeamFormData>;
  onNext: (data: Partial<TeamFormData>) => void;
  onBack: () => void;
}

const GAME_TYPES: GameType[] = ["campo", "society", "futsal", "beach"];
const CATEGORIES: { value: TeamCategory; label: string; emoji: string }[] = [
  { value: "masculino", label: "Masculino", emoji: "♂️" },
  { value: "feminino", label: "Feminino", emoji: "♀️" },
  { value: "mista", label: "Mista", emoji: "⚧️" },
];

export function TeamStepBasics({ initial = {}, onNext, onBack }: TeamStepBasicsProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [gameType, setGameType] = useState<GameType | "">(initial.game_type ?? "");
  const [category, setCategory] = useState<TeamCategory>(initial.category ?? "masculino");

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

  const handleNext = () => {
    if (!name.trim() || name.trim().length < 3) {
      toast({ title: "Nome do grupo obrigatório", description: "Escolha um nome com pelo menos 3 letras.", variant: "destructive" });
      return;
    }
    if (!gameType) {
      toast({ title: "Selecione o tipo de campo", variant: "destructive" });
      return;
    }
    onNext({ name: name.trim(), description: description.trim() || undefined, logo_url: logoUrl || undefined, game_type: gameType, category });
  };

  const initials = name.substring(0, 2).toUpperCase() || "⚽";

  return (
    <div className="w-full max-w-md mx-auto">
      <WizardProgress step={1} total={5} label="Dados do grupo" />

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Vamos criar seu grupo!</h2>
          <p className="text-sm text-muted-foreground">Comece dando um nome e escolhendo o tipo de jogo.</p>
        </div>

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
            <Label htmlFor="tname">Nome do grupo *</Label>
            <Input id="tname" placeholder="Ex: Pelada do Bairro" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
          <span>Escolha um nome que identifique bem o grupo. Ele aparecerá para todos os jogadores.</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tdesc">Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Textarea id="tdesc" placeholder="Conte um pouco sobre o time..." value={description} onChange={e => setDescription(e.target.value)} maxLength={200} rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Tipo do campo *</Label>
          <div className="space-y-2">
            {GAME_TYPES.map(t => {
              const info = GAME_TYPE_INFO[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGameType(t)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
                    gameType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <p>{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm transition-all",
                  category === c.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                <span className="text-lg">{c.emoji}</span>
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-1" onClick={handleNext} disabled={!name.trim() || !gameType}>
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
