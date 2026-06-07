// ============================================================
// src/components/admin/PromoCodeManager.tsx
// Painel de gestão financeira do master admin
// Geração de códigos promocionais (trial grátis ou desconto)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Badge }   from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Copy, CheckCircle2, Tag, Trash2 } from "lucide-react";

interface PromoCode {
  id:          string;
  code:        string;
  type:        string;
  value:       number;
  max_uses:    number | null;
  used_count:  number;
  expires_at:  string | null;
  is_active:   boolean;
  created_at:  string;
}

function randomCode(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

export function PromoCodeManager() {
  const { toast } = useToast();
  const [codes, setCodes]     = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);

  // Form state
  const [type,    setType]    = useState<"free_trial" | "discount_percent">("free_trial");
  const [value,   setValue]   = useState("30");   // days or percent
  const [maxUses, setMaxUses] = useState("1");
  const [expDays, setExpDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setCodes((data as PromoCode[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    const code = randomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expDays));

    const { error } = await supabase.from("promo_codes").insert({
      code,
      type,
      value:    Number(value),
      max_uses: maxUses === "0" ? null : Number(maxUses),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (error) {
      toast({ title: "Erro ao criar código", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Código ${code} criado!` });
      load();
    }
    setCreating(false);
  };

  const deactivate = async (id: string) => {
    await supabase.from("promo_codes").update({ is_active: false }).eq("id", id);
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const typeLabel = (t: string, v: number) => {
    if (t === "free_trial")       return `${v} dias grátis`;
    if (t === "discount_percent") return `${v}% desconto`;
    return t;
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" /> Gerar Novo Código
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as any)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free_trial">Trial grátis (dias)</SelectItem>
                  <SelectItem value="discount_percent">Desconto (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{type === "free_trial" ? "Dias grátis" : "Desconto (%)"}</Label>
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="h-9 text-sm"
                min="1"
                max={type === "free_trial" ? "365" : "100"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Usos máximos (0 = ilimitado)</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="h-9 text-sm"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expira em (dias)</Label>
              <Input
                type="number"
                value={expDays}
                onChange={e => setExpDays(e.target.value)}
                className="h-9 text-sm"
                min="1"
              />
            </div>
          </div>
          <Button onClick={create} disabled={creating} className="w-full gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Gerar código aleatório
          </Button>
        </CardContent>
      </Card>

      {/* Code list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Códigos gerados ({codes.length})</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum código ainda.</p>
        ) : (
          <div className="space-y-2">
            {codes.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <code className="flex-1 font-mono font-bold text-primary text-sm">{c.code}</code>
                <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                  {typeLabel(c.type, c.value)}
                </Badge>
                <span className="text-xs text-muted-foreground">{c.used_count}/{c.max_uses ?? "∞"}</span>
                <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                  {copied === c.code
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Copy className="h-4 w-4" />}
                </button>
                {c.is_active && (
                  <button onClick={() => deactivate(c.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
