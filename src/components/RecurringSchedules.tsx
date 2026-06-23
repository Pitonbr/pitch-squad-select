import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Repeat, Plus, Trash2, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Schedule {
  id: string;
  title: string;
  day_of_week: number;
  time: string;
  location: string;
  description: string | null;
  checkin_deadline_minutes: number;
  weeks_ahead: number;
  active: boolean;
}

const emptyForm = {
  title: "",
  day_of_week: "2",
  time: "20:00",
  location: "",
  description: "",
  checkin_deadline_minutes: 30,
  weeks_ahead: 4,
};

export function RecurringSchedules({ onGamesGenerated }: { onGamesGenerated?: () => void }) {
  const { profile } = useAuth();
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!activeTeam?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("recurring_game_schedules")
      .select("*")
      .eq("team_id", activeTeam.id)
      .order("day_of_week");
    setSchedules((data as any) || []);
    setLoading(false);
  }, [activeTeam?.id]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleCreate = async () => {
    if (!activeTeam?.id || !profile?.id) return;
    if (!form.title.trim() || !form.location.trim()) {
      toast({ title: "Preencha nome e local", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("recurring_game_schedules").insert({
      team_id: activeTeam.id,
      title: form.title.trim(),
      day_of_week: parseInt(form.day_of_week, 10),
      time: form.time,
      location: form.location.trim(),
      description: form.description.trim() || null,
      checkin_deadline_minutes: form.checkin_deadline_minutes,
      weeks_ahead: form.weeks_ahead,
      created_by: profile.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro ao criar agendamento", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agendamento recorrente criado!" });
    setForm(emptyForm);
    setOpen(false);
    await fetchSchedules();
    await handleGenerate();
  };

  const handleToggleActive = async (schedule: Schedule) => {
    await supabase.from("recurring_game_schedules").update({ active: !schedule.active }).eq("id", schedule.id);
    await fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("recurring_game_schedules").delete().eq("id", id);
    await fetchSchedules();
  };

  const handleGenerate = async () => {
    if (!activeTeam?.id) return;
    const { data, error } = await supabase.rpc("generate_recurring_games", { p_team_id: activeTeam.id });
    if (error) { toast({ title: "Erro ao gerar jogos", description: error.message, variant: "destructive" }); return; }
    if (data && (data as number) > 0) {
      toast({ title: `${data} jogo(s) gerado(s) automaticamente!` });
      onGamesGenerated?.();
    }
  };

  // Sempre que a tela abre, garante que os próximos jogos já existem.
  useEffect(() => { if (activeTeam?.id) handleGenerate(); }, [activeTeam?.id]);

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="h-5 w-5 text-primary" />
            Jogos Recorrentes
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo agendamento recorrente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome do jogo</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Pelada de Terça" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Dia da semana</Label>
                    <Select value={form.day_of_week} onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAY_LABELS.map((label, i) => (
                          <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Horário</Label>
                    <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Local</Label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Ex: Quadra Central" />
                </div>
                <div className="space-y-1">
                  <Label>Observações (opcional)</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Prazo de check-in (min)</Label>
                    <Input type="number" min="0" value={form.checkin_deadline_minutes} onChange={(e) => setForm((f) => ({ ...f, checkin_deadline_minutes: parseInt(e.target.value, 10) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Gerar quantas semanas?</Label>
                    <Input type="number" min="1" max="12" value={form.weeks_ahead} onChange={(e) => setForm((f) => ({ ...f, weeks_ahead: parseInt(e.target.value, 10) || 1 }))} />
                  </div>
                </div>
                <Button type="button" className="w-full" disabled={saving} onClick={handleCreate}>
                  Criar agendamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum jogo recorrente configurado. Crie um para gerar os próximos jogos automaticamente.</p>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{s.title}</p>
                  {!s.active && <Badge variant="outline" className="text-xs">Pausado</Badge>}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{DAY_LABELS[s.day_of_week]}, {s.time.slice(0, 5)}</span>
                  <MapPin className="h-3 w-3" /> {s.location}
                </p>
              </div>
              <Switch checked={s.active} onCheckedChange={() => handleToggleActive(s)} />
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
