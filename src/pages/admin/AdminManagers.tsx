import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Shield,
  Eye,
  UserPlus,
  ToggleRight,
  ToggleLeft,
  Crown,
  AlertCircle,
} from "lucide-react";

interface Manager {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: "master_admin" | "admin" | "viewer";
  is_active: boolean;
  notes: string | null;
  granted_at: string;
  updated_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; badgeClass: string }> = {
  master_admin: {
    label: "Master Admin",
    icon: Crown,
    color: "text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  viewer: {
    label: "Visualizador",
    icon: Eye,
    color: "text-slate-400",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  master_admin: "Acesso total — gerencia outros gestores, configurações e dados financeiros",
  admin: "Acesso completo exceto gerenciar outros gestores",
  viewer: "Somente leitura — visualiza dados sem poder editar",
};

export default function AdminManagers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "admin", notes: "" });

  const { data: managers = [], isLoading } = useQuery<Manager[]>({
    queryKey: ["admin-managers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_managers");
      if (error) throw error;
      return (data ?? []) as Manager[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("upsert_admin_manager", {
        p_email: form.email.trim().toLowerCase(),
        p_full_name: form.full_name.trim(),
        p_role: form.role,
        p_notes: form.notes.trim() || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (result: { user_found: boolean; email: string; role: string }) => {
      qc.invalidateQueries({ queryKey: ["admin-managers"] });
      setAddOpen(false);
      setForm({ email: "", full_name: "", role: "admin", notes: "" });
      toast({
        title: "Gestor adicionado",
        description: result?.user_found
          ? `${form.email} adicionado como ${ROLE_CONFIG[form.role].label}.`
          : `${form.email} cadastrado. Acesso liberado quando a conta for criada no app.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.rpc("toggle_admin_manager", {
        p_manager_id: id,
        p_active: active,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-managers"] }),
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const activeManagers = managers.filter((m) => m.is_active);
  const inactiveManagers = managers.filter((m) => !m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestores do Painel</h1>
          <p className="text-slate-400 text-sm mt-1">
            Controle de acesso ao painel administrativo
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 gap-2">
              <UserPlus className="w-4 h-4" />
              Adicionar Gestor
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Gestor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="gestor@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  placeholder="Nome do gestor"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nível de acesso</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">{ROLE_DESCRIPTIONS[form.role]}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: Responsável pela área de marketing"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="bg-slate-800 border-slate-600 resize-none h-20"
                />
              </div>

              {!form.email.includes("@") || !form.full_name.trim() ? null : (
                <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <span>
                    Se a conta ainda não existir no app, o acesso será liberado automaticamente quando
                    o usuário criar sua conta com esse email.
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)} className="border-slate-600">
                Cancelar
              </Button>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!form.email.trim() || !form.full_name.trim() || addMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {addMutation.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de Gestores", value: managers.length, icon: ShieldCheck, color: "text-emerald-400" },
          { label: "Ativos", value: activeManagers.length, icon: Shield, color: "text-blue-400" },
          { label: "Inativos", value: inactiveManagers.length, icon: ToggleLeft, color: "text-slate-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active managers */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Gestores Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Carregando...</div>
          ) : activeManagers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhum gestor ativo</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {activeManagers.map((m) => {
                const cfg = ROLE_CONFIG[m.role];
                const Icon = cfg.icon;
                const isMaster = m.email === "alexpiton@gmail.com";
                return (
                  <div key={m.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{m.full_name}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${cfg.badgeClass}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                        {m.notes && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">{m.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500 hidden sm:block">
                        desde {new Date(m.granted_at).toLocaleDateString("pt-BR")}
                      </span>
                      {isMaster ? (
                        <span className="text-xs text-amber-400/60 italic">proprietário</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                          onClick={() => toggleMutation.mutate({ id: m.id, active: false })}
                          disabled={toggleMutation.isPending}
                        >
                          <ToggleLeft className="w-4 h-4" />
                          <span className="text-xs">Revogar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive managers */}
      {inactiveManagers.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-base flex items-center gap-2">
              <ToggleLeft className="w-4 h-4" />
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/30">
              {inactiveManagers.map((m) => {
                const cfg = ROLE_CONFIG[m.role];
                return (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3 opacity-60">
                    <div>
                      <span className="text-sm text-slate-400">{m.full_name}</span>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-emerald-400 hover:text-emerald-300 h-8 px-2"
                      onClick={() => toggleMutation.mutate({ id: m.id, active: true })}
                      disabled={toggleMutation.isPending}
                    >
                      <ToggleRight className="w-4 h-4" />
                      <span className="text-xs">Reativar</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role reference card */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-400 text-sm">Níveis de Acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={role} className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 ${cfg.color}`} />
                <div>
                  <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                  <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
