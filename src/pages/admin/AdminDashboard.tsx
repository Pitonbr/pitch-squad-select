import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, Shield, Gamepad2, Megaphone, TrendingUp, AlertCircle, UserCheck, Ban,
} from "lucide-react";

interface DashboardStats {
  total_users: number;
  active_teams: number;
  games_last_30d: number;
  broadcasts_sent: number;
  blocked_users: number;
  new_users_7d: number;
}

function KpiCard({
  title, value, icon: Icon, sub, accent = "emerald", loading,
}: {
  title: string; value: string | number; icon: React.ElementType;
  sub?: string; accent?: string; loading?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue:    "text-blue-400   bg-blue-500/10   border-blue-500/20",
    amber:   "text-amber-400  bg-amber-500/10  border-amber-500/20",
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20",
    red:     "text-red-400    bg-red-500/10    border-red-500/20",
    cyan:    "text-cyan-400   bg-cyan-500/10   border-cyan-500/20",
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-2">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-slate-800" />
            ) : (
              <p className="text-3xl font-bold text-white">{value}</p>
            )}
            {sub && !loading && (
              <p className="text-slate-500 text-xs mt-1">{sub}</p>
            )}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${colors[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (error) throw error;
      return data as unknown as DashboardStats;
    },
    refetchInterval: 60_000,
  });

  const { data: recentBroadcasts } = useQuery({
    queryKey: ["admin-recent-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_broadcasts")
        .select("id, title, target, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral da plataforma em tempo real</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Erro ao carregar estatísticas. Verifique a conexão com o Supabase.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          title="Total de Usuários"
          value={stats?.total_users ?? 0}
          sub={`+${stats?.new_users_7d ?? 0} nos últimos 7 dias`}
          icon={Users}
          accent="emerald"
          loading={isLoading}
        />
        <KpiCard
          title="Times Ativos"
          value={stats?.active_teams ?? 0}
          icon={Shield}
          accent="blue"
          loading={isLoading}
        />
        <KpiCard
          title="Jogos (30 dias)"
          value={stats?.games_last_30d ?? 0}
          icon={Gamepad2}
          accent="purple"
          loading={isLoading}
        />
        <KpiCard
          title="Comunicados Enviados"
          value={stats?.broadcasts_sent ?? 0}
          icon={Megaphone}
          accent="cyan"
          loading={isLoading}
        />
        <KpiCard
          title="Usuários Bloqueados"
          value={stats?.blocked_users ?? 0}
          icon={Ban}
          accent="red"
          loading={isLoading}
        />
        <KpiCard
          title="Novos Usuários (7d)"
          value={stats?.new_users_7d ?? 0}
          icon={UserCheck}
          accent="amber"
          loading={isLoading}
        />
      </div>

      {/* Recent broadcasts */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-cyan-400" />
            Comunicados Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentBroadcasts || recentBroadcasts.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">Nenhum comunicado enviado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentBroadcasts.map((b) => (
                <div key={b.id} className="flex items-start justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{b.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(b.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                      {b.target}
                    </Badge>
                    {b.sent_at ? (
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Enviado
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="text-slate-300 text-sm font-medium mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/admin/users",        icon: Users,    label: "Gerenciar\nusuários",  color: "emerald" },
            { to: "/admin/announcements",icon: Megaphone,label: "Novo\ncomunicado",    color: "cyan" },
            { to: "/admin/coupons",      icon: TrendingUp,label: "Criar\ncupom",       color: "purple" },
            { to: "/admin/banners",      icon: Shield,   label: "Publicar\nbanner",    color: "amber" },
          ].map(({ to, icon: Icon, label, color }) => (
            <a
              key={to}
              href={to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Icon className={`h-5 w-5 text-${color}-400`} />
              <span className="text-slate-300 text-xs text-center whitespace-pre-line leading-tight">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
