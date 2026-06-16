import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Image, Plus, Trash2, ToggleLeft, ToggleRight, MousePointerClick,
  Eye, ExternalLink, Upload, LayoutDashboard, Gamepad2, Users, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  target: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
}

const TARGET_OPTIONS = [
  { value: "all",       label: "Todas as telas",  icon: LayoutDashboard },
  { value: "dashboard", label: "Dashboard",        icon: LayoutDashboard },
  { value: "games",     label: "Jogos",            icon: Gamepad2 },
  { value: "teams",     label: "Times",            icon: Users },
  { value: "financial", label: "Financeiro",       icon: BarChart3 },
];

function targetLabel(t: string) {
  return TARGET_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

function ctr(impressions: number, clicks: number) {
  if (impressions === 0) return "—";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string;
}) {
  const colors: Record<string, string> = {
    blue:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create Banner Dialog ──────────────────────────────────────
function CreateBannerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file,    setFile]    = useState<File | null>(null);
  const [form, setForm] = useState({
    title:     "",
    link_url:  "",
    link_text: "",
    target:    "all",
    starts_at: "",
    ends_at:   "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2 MB)");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCreate = async () => {
    if (!file || !form.title.trim()) return;
    setUploading(true);
    try {
      // Upload image
      const ext      = file.name.split(".").pop() ?? "jpg";
      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("admin-banners")
        .upload(filePath, file, { contentType: file.type });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("admin-banners")
        .getPublicUrl(filePath);

      // Insert record
      const { error: dbErr } = await supabase.from("admin_banners").insert({
        title:     form.title.trim(),
        image_url: publicUrl,
        link_url:  form.link_url.trim()  || null,
        link_text: form.link_text.trim() || null,
        target:    form.target,
        starts_at: form.starts_at || null,
        ends_at:   form.ends_at   || null,
      });

      if (dbErr) throw dbErr;

      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner publicado!");
      setFile(null);
      setPreview(null);
      setForm({ title: "", link_url: "", link_text: "", target: "all", starts_at: "", ends_at: "" });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar banner");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-400" />
            Novo Banner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image upload */}
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Imagem do banner</label>
            <div
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                preview ? "border-blue-500/40" : "border-slate-700 hover:border-slate-600"
              }`}
              style={{ aspectRatio: "16/5" }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                  <Upload className="h-6 w-6" />
                  <p className="text-xs">Clique para selecionar (PNG/JPG/WebP, máx. 2 MB)</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Título do banner</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Novo recurso disponível!"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Link (URL)</label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://…"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Texto do botão</label>
              <Input
                value={form.link_text}
                onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                placeholder="Saiba mais"
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={40}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Exibir em</label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {TARGET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-white">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Início</label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Fim</label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!file || !form.title.trim() || uploading}
            onClick={handleCreate}
          >
            {uploading ? "Publicando…" : "Publicar banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminBanners() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_banners");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const totalImpressions = banners.reduce((s, b) => s + b.impressions, 0);
  const totalClicks      = banners.reduce((s, b) => s + b.clicks, 0);
  const activeBanners    = banners.filter((b) => b.is_active).length;

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("admin_banners")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
    onError: () => toast.error("Erro ao atualizar banner"),
  });

  const remove = useMutation({
    mutationFn: async ({ id, image_url }: { id: string; image_url: string }) => {
      // Extract filename from public URL
      const urlParts  = image_url.split("/admin-banners/");
      const fileName  = urlParts[1];
      if (fileName) {
        await supabase.storage.from("admin-banners").remove([fileName]);
      }
      const { error } = await supabase.from("admin_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner removido");
    },
    onError: () => toast.error("Erro ao remover banner"),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Image className="h-6 w-6 text-blue-400" />
            Banners & Publicidade
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Publique banners visuais dentro do app com rastreamento de cliques
          </p>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total de banners" value={banners.length}     icon={Image}             accent="blue" />
        <StatCard label="Banners ativos"   value={activeBanners}      icon={ToggleRight}        accent="emerald" />
        <StatCard label="Impressões"       value={totalImpressions}   icon={Eye}               accent="cyan" />
        <StatCard label="CTR médio"        value={ctr(totalImpressions, totalClicks)} icon={MousePointerClick} accent="purple" />
      </div>

      {/* Banner list */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Image className="h-4 w-4 text-blue-400" />
            Todos os Banners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full bg-slate-800" />)}
            </div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center">
              <Image className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhum banner criado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className={`flex gap-3 p-3 rounded-xl border transition-opacity ${
                    b.is_active
                      ? "bg-slate-800/60 border-slate-700"
                      : "bg-slate-800/20 border-slate-800 opacity-50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-32 shrink-0 rounded-lg overflow-hidden bg-slate-700" style={{ aspectRatio: "16/5" }}>
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-slate-200 text-sm font-medium">{b.title}</p>
                      <Badge className={`text-xs ${
                        b.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {b.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                        {targetLabel(b.target)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-slate-500 text-xs flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {b.impressions.toLocaleString()} imp.
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        {b.clicks.toLocaleString()} cliques
                      </span>
                      <span>{ctr(b.impressions, b.clicks)} CTR</span>
                      {b.link_url && (
                        <a
                          href={b.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {b.link_text ?? "Link"}
                        </a>
                      )}
                    </div>

                    {(b.starts_at || b.ends_at) && (
                      <p className="text-slate-600 text-xs mt-1">
                        {b.starts_at && `De ${new Date(b.starts_at).toLocaleDateString("pt-BR")}`}
                        {b.ends_at   && ` até ${new Date(b.ends_at).toLocaleDateString("pt-BR")}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-2 shrink-0">
                    <button
                      onClick={() => toggle.mutate({ id: b.id, is_active: !b.is_active })}
                      disabled={toggle.isPending}
                      className="text-slate-400 hover:text-emerald-400 transition-colors mt-0.5"
                      title={b.is_active ? "Desativar" : "Ativar"}
                    >
                      {b.is_active
                        ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                        : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => remove.mutate({ id: b.id, image_url: b.image_url })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBannerDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
