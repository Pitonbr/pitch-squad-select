// ============================================================
// src/components/onboarding/PlayerSticker.tsx
// Tela A.4 — Figurinha do jogador (estilo álbum de Copa do Mundo)
// Composição 100% client-side via <canvas>, sem custo e sem IA.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RotateCcw, ChevronRight, Camera } from "lucide-react";
import { PersonalData, POSITIONS } from "@/types/onboarding";

interface PlayerStickerProps {
  personal: Partial<PersonalData>;
  onNext: (stickerUrl: string | undefined) => void;
  onRetakePhoto: () => void;
}

const CARD_W = 320;
const CARD_H = 440;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawSticker(
  canvas: HTMLCanvasElement,
  data: { photoUrl?: string; name: string; nickname?: string; jersey?: number; positionLabel?: string }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, "#064e3b");
  bg.addColorStop(1, "#022c22");
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, CARD_W, CARD_H, 24);
  ctx.fill();

  // Outer decorative border
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 6, 6, CARD_W - 12, CARD_H - 12, 20);
  ctx.stroke();
  ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 14, 14, CARD_W - 28, CARD_H - 28, 16);
  ctx.stroke();

  // Header band
  ctx.fillStyle = "#10b981";
  drawRoundedRect(ctx, 24, 24, CARD_W - 48, 32, 8);
  ctx.fill();
  ctx.fillStyle = "#022c22";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚽ SOCCER SQUAD", CARD_W / 2, 45);

  // Photo frame
  const photoX = 44, photoY = 70, photoSize = CARD_W - 88;
  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, 12);
  ctx.clip();
  if (data.photoUrl) {
    try {
      const img = await loadImage(data.photoUrl);
      // Cover-fit
      const ratio = Math.max(photoSize / img.width, photoSize / img.height);
      const w = img.width * ratio, h = img.height * ratio;
      ctx.drawImage(img, photoX + (photoSize - w) / 2, photoY + (photoSize - h) / 2, w, h);
    } catch {
      ctx.fillStyle = "#065f46";
      ctx.fillRect(photoX, photoY, photoSize, photoSize);
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((data.name || "?").charAt(0).toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 22);
    }
  } else {
    ctx.fillStyle = "#065f46";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);
    ctx.fillStyle = "#a7f3d0";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((data.name || "?").charAt(0).toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2 + 22);
  }
  ctx.restore();
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, 12);
  ctx.stroke();

  // Jersey number badge (top-right corner of photo)
  if (data.jersey) {
    const bx = photoX + photoSize - 8, by = photoY + 8;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(data.jersey), bx, by + 7);
  }

  // Name
  const nameY = photoY + photoSize + 36;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  const displayName = (data.nickname || data.name || "Jogador").toUpperCase();
  ctx.fillText(displayName.length > 18 ? displayName.slice(0, 17) + "…" : displayName, CARD_W / 2, nameY);

  // Position badge
  if (data.positionLabel) {
    ctx.fillStyle = "#34d399";
    ctx.font = "600 13px sans-serif";
    ctx.fillText(data.positionLabel, CARD_W / 2, nameY + 24);
  }

  // Footer stars decoration
  ctx.fillStyle = "rgba(52, 211, 153, 0.5)";
  ctx.font = "14px sans-serif";
  ctx.fillText("★ ★ ★ ★ ★", CARD_W / 2, CARD_H - 24);
}

export function PlayerSticker({ personal, onNext, onRetakePhoto }: PlayerStickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [rendering, setRendering] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(personal.photo_url);

  const positionLabel = personal.positions?.[0]
    ? POSITIONS.find(p => p.code === personal.positions![0])?.label
    : undefined;

  useEffect(() => {
    let mounted = true;
    setRendering(true);
    (async () => {
      if (canvasRef.current) {
        await drawSticker(canvasRef.current, {
          photoUrl,
          name: personal.full_name ?? "",
          nickname: personal.nickname,
          jersey: personal.jersey_number,
          positionLabel,
        });
      }
      if (mounted) setRendering(false);
    })();
    return () => { mounted = false; };
  }, [photoUrl, personal.full_name, personal.nickname, personal.jersey_number, positionLabel]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
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
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleContinue = async () => {
    if (!canvasRef.current) { onNext(undefined); return; }
    setSaving(true);
    try {
      const blob: Blob | null = await new Promise(resolve => canvasRef.current!.toBlob(resolve, "image/png"));
      if (!blob) { onNext(undefined); return; }
      const path = `stickers/${Date.now()}.png`;
      const { error } = await supabase.storage.from("player-images").upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("player-images").getPublicUrl(path);
      onNext(publicUrl);
    } catch {
      toast({ title: "Não foi possível salvar a figurinha", description: "Você pode continuar sem ela.", variant: "destructive" });
      onNext(undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Sua figurinha está pronta! ⚽</h2>
        <p className="text-sm text-muted-foreground">Assim seus colegas vão te ver no álbum do time</p>
      </div>

      <div className="flex justify-center relative">
        {(rendering || uploadingPhoto) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-xl"
          style={{ width: CARD_W, height: CARD_H, opacity: (rendering || uploadingPhoto) ? 0.2 : 1, transition: "opacity 0.3s" }}
        />
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingPhoto || saving}
        >
          <Camera className="h-4 w-4" /> Tirar foto ou escolher da galeria
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="gap-1" onClick={onRetakePhoto} disabled={saving}>
          <RotateCcw className="h-4 w-4" /> Voltar
        </Button>
        <Button className="flex-1 gap-1" onClick={handleContinue} disabled={rendering || saving || uploadingPhoto}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar <ChevronRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
