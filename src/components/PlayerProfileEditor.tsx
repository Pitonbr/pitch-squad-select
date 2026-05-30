// ============================================================
// src/components/PlayerProfileEditor.tsx
// Edição completa do perfil de jogador — Settings > Perfil
// Salva: players table (nome, apelido, posição, camisa, foto)
//        profiles table (display_name, phone)
//        localStorage  (posição 2ª, pé, altura, peso, nascimento)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, Save, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { PositionSelector } from "@/components/onboarding/PositionSelector";
import { FieldPosition, PreferredFoot } from "@/types/onboarding";

// ── LocalStorage extended profile ───────────────────────────

interface PlayerExtData {
  birth_date?: string;
  position_2?: FieldPosition;
  preferred_foot?: PreferredFoot;
  height_cm?: number;
  weight_kg?: number;
}

function extKey(userId: string) {
  return `player_ext_${userId}`;
}

function loadExt(userId: string): PlayerExtData {
  try {
    const raw = localStorage.getItem(extKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveExt(userId: string, data: PlayerExtData) {
  localStorage.setItem(extKey(userId), JSON.stringify(data));
}

// ── Component ────────────────────────────────────────────────

interface PlayerRow {
  id: string;
  name: string;
  nickname: string;
  position: string;
  jersey_number: number | null;
  skill_level: number | null;
  profile_image: string | null;
  phone: string;
}

export function PlayerProfileEditor() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const { activeTeam } = useTeams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // DB fields
  const [name, setName]           = useState("");
  const [nickname, setNickname]   = useState("");
  const [phone, setPhone]         = useState("");
  const [jersey, setJersey]       = useState("");
  const [photoUrl, setPhotoUrl]   = useState("");

  // Position — primary from DB (string), secondary from localStorage
  const [primaryPos, setPrimaryPos]   = useState<FieldPosition | "">("");
  const [secondaryPos, setSecondaryPos] = useState<FieldPosition | "">("");

  // localStorage fields
  const [birthDate, setBirthDate] = useState("");
  const [foot, setFoot]           = useState<PreferredFoot | "">("");
  const [height, setHeight]       = useState(175);
  const [weight, setWeight]       = useState(75);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!profile || !activeTeam) { setLoadingData(false); return; }

      // Load player row
      const { data: player } = await supabase
        .from("players")
        .select("id, name, nickname, position, jersey_number, skill_level, profile_image, phone")
        .eq("team_id", activeTeam.id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (player) {
        setPlayerId(player.id);
        setName(player.name || "");
        setNickname(player.nickname || "");
        setPhone(player.phone || profile.phone || "");
        setJersey(player.jersey_number?.toString() || "");
        setPhotoUrl(player.profile_image || "");
        // Primary position stored as string in DB
        setPrimaryPos((player.position as FieldPosition) || "");
      } else {
        // Fallback to profile data if no player row
        setName(profile.display_name || "");
        setPhone(profile.phone || "");
      }

      // Load extended data from localStorage
      if (user?.id) {
        const ext = loadExt(user.id);
        setBirthDate(ext.birth_date || "");
        setSecondaryPos(ext.position_2 || "");
        setFoot(ext.preferred_foot || "");
        setHeight(ext.height_cm || 175);
        setWeight(ext.weight_kg || 75);
      }

      setLoadingData(false);
    };

    load();
  }, [profile?.id, activeTeam?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo upload ────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `profiles/${user?.id}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("player-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("player-images").getPublicUrl(path);
      setPhotoUrl(publicUrl);
      toast({ title: "Foto atualizada!" });
    } catch {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ── Position helper ─────────────────────────────────────────
  // PositionSelector works with FieldPosition[] — wrap/unwrap
  const posArray: FieldPosition[] = [
    ...(primaryPos ? [primaryPos] : []),
    ...(secondaryPos ? [secondaryPos] : []),
  ];
  const handlePositionChange = (positions: FieldPosition[]) => {
    setPrimaryPos(positions[0] || "");
    setSecondaryPos(positions[1] || "");
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" }); return;
    }

    setSaving(true);
    try {
      // 1. Update profiles table
      if (profile?.id) {
        await supabase.from("profiles").update({
          display_name: name.trim(),
          phone: phone.trim() || null,
        }).eq("id", profile.id);
      }

      // 2. Update players table (if player row exists)
      if (playerId) {
        await supabase.from("players").update({
          name: name.trim(),
          nickname: nickname.trim(),
          position: primaryPos || "Outro",
          jersey_number: jersey ? parseInt(jersey) : null,
          profile_image: photoUrl || null,
          phone: phone.trim(),
        }).eq("id", playerId);
      }

      // 3. Save extended data to localStorage
      if (user?.id) {
        saveExt(user.id, {
          birth_date: birthDate || undefined,
          position_2: secondaryPos || undefined,
          preferred_foot: foot || undefined,
          height_cm: height,
          weight_kg: weight,
        });
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="space-y-8">

      {/* ── Identidade ── */}
      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Identidade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Nome, foto e informações de contato</p>
        </div>

        {/* Photo + name row */}
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <Avatar className="h-20 w-20 ring-2 ring-border">
              <AvatarImage src={photoUrl} />
              <AvatarFallback className="text-xl font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Nome completo *</Label>
              <Input id="pf-name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-nick">Apelido <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="pf-nick" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ex: Ronaldinho, Tartaruga..." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-email">Email</Label>
            <Input id="pf-email" value={user?.email || ""} disabled className="bg-muted text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Não pode ser alterado</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-phone">Telefone</Label>
            <Input id="pf-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-birth">Data de nascimento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="pf-birth"
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-jersey">Número de camisa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="pf-jersey"
              type="number"
              min={1}
              max={99}
              value={jersey}
              onChange={e => setJersey(e.target.value)}
              placeholder="Seu número favorito (1–99)"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Perfil de jogador ── */}
      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Perfil de jogador</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Posição, pé preferido e dados físicos</p>
        </div>

        {/* Positions */}
        <div className="space-y-2">
          <Label>Posição em campo <span className="text-muted-foreground text-xs">(até 2)</span></Label>
          <PositionSelector selected={posArray} onChange={handlePositionChange} />
        </div>

        {/* Preferred foot */}
        <div className="space-y-2">
          <Label>Pé preferido</Label>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {(["right", "left"] as PreferredFoot[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFoot(prev => prev === f ? "" : f)}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                  foot === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                <Footprints className="h-4 w-4" />
                {f === "right" ? "Direito" : "Esquerdo"}
              </button>
            ))}
          </div>
        </div>

        {/* Physical data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Altura</Label>
              <span className="text-base font-bold text-primary">{(height / 100).toFixed(2).replace(".", ",")} m</span>
            </div>
            <Slider min={150} max={210} step={1} value={[height]} onValueChange={([v]) => setHeight(v)} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>1,50 m</span><span>2,10 m</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Peso</Label>
              <span className="text-base font-bold text-primary">{weight} kg</span>
            </div>
            <Slider min={50} max={130} step={1} value={[weight]} onValueChange={([v]) => setWeight(v)} />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>50 kg</span><span>130 kg</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Save button ── */}
      <Button
        className="w-full gap-2 h-11 font-semibold"
        onClick={handleSave}
        disabled={saving || !name.trim()}
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
          : <><Save className="h-4 w-4" /> Salvar alterações</>}
      </Button>

      {!activeTeam && (
        <p className="text-xs text-center text-muted-foreground">
          Algumas informações só são salvas no time após você ingressar em um.
        </p>
      )}
    </div>
  );
}
