// ============================================================
// src/components/Sidebar.tsx  — FASE 1
// Sidebar fixa lateral esquerda, substituindo Header.tsx
// Desktop: 220px expandida  |  Tablet: 64px colapsada
// Mobile: oculta (BottomNav assume)
// ============================================================

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TeamSelector } from "@/components/TeamSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { RealtimeIndicator } from "@/components/RealtimeIndicator";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VersionIndicator } from "@/components/VersionIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/soccer-squad-logo.jpeg";
import { ViewType, NAV_ITEMS } from "@/types/navigation";
import {
  LayoutDashboard, Users, Calendar, Play, Award, Trophy,
  UserCog, DollarSign, UserPlus, FileText, ShieldCheck,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Calendar, Play, Award, Trophy,
  UserCog, DollarSign, UserPlus, FileText, ShieldCheck,
  Settings, LogOut,
};

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { activeTeam, getUserRole } = useTeams();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!activeTeam || !profile) return;
    fetchUnreadCount();
    const channel = supabase.channel("sidebar-notif")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_notifications", filter: `team_id=eq.${activeTeam.id}` }, fetchUnreadCount)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification_reads" }, fetchUnreadCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTeam?.id, profile]);

  const fetchUnreadCount = async () => {
    if (!activeTeam || !profile) return;
    try {
      const { data } = await supabase
        .from("game_notifications")
        .select(`id, notification_reads!left(profile_id)`)
        .eq("team_id", activeTeam.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const n = data?.filter((x: any) => !x.notification_reads?.some((r: any) => r.profile_id === profile.id)).length || 0;
      setUnreadCount(n);
    } catch {}
  };

  const userRole = activeTeam ? getUserRole(activeTeam.id) : null;
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!activeTeam) return false;
    if (userRole === "admin") return true;
    if (userRole === "player") return item.playerAllowed === true;
    return false;
  });

  const mainItems   = visibleItems.filter(i => i.group === "main");
  const manageItems = visibleItems.filter(i => i.group === "manage");
  const adminItems  = visibleItems.filter(i => i.group === "admin");

  const renderItem = (item: typeof NAV_ITEMS[0]) => {
    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
    const isActive = currentView === item.key;
    const btn = (
      <button
        key={item.key}
        onClick={() => onViewChange(item.key)}
        className={[
          "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          collapsed ? "justify-center p-2" : "px-3 py-2.5",
          isActive
            ? "bg-primary/15 text-primary border border-primary/25"
            : "text-foreground/60 hover:text-foreground hover:bg-muted/60",
        ].join(" ")}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
    if (collapsed) return (
      <Tooltip key={item.key} delayDuration={200}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
      </Tooltip>
    );
    return btn;
  };

  return (
    <aside className={[
      "hidden md:flex flex-col h-screen sticky top-0 border-r border-border/40",
      "bg-card/80 backdrop-blur-md transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-[220px]",
    ].join(" ")}>

      {/* Logo + toggle */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoImage} alt="Soccer Squad" className="h-9 w-9 rounded-xl object-contain ring-1 ring-primary/20" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">Soccer Squad</p>
              <p className="text-[10px] text-muted-foreground truncate">Gestão de Partidas</p>
            </div>
          </div>
        )}
        {collapsed && <img src={logoImage} alt="Soccer Squad" className="h-9 w-9 rounded-xl object-contain ring-1 ring-primary/20" />}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onClick={onToggleCollapse} aria-label={collapsed ? "Expandir" : "Recolher"}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Team selector */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <TeamSelector onCreateTeam={() => onViewChange("teamManager")} />
        </div>
      )}

      <Separator className="opacity-40" />

      {/* Badge de notificações */}
      {!collapsed && unreadCount > 0 && (
        <div className="px-3 py-2">
          <button onClick={() => onViewChange("dashboard")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15 transition-colors">
            <Bell className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-xs">{unreadCount} nova{unreadCount !== 1 ? "s" : ""} notificação{unreadCount !== 1 ? "ões" : ""}</span>
            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{unreadCount > 9 ? "9+" : unreadCount}</Badge>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-none">
        {mainItems.map(renderItem)}
        {manageItems.length > 0 && (<>
          {!collapsed ? <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Gerenciar</p>
                      : <Separator className="my-2 opacity-30" />}
          {manageItems.map(renderItem)}
        </>)}
        {adminItems.length > 0 && (<>
          {!collapsed ? <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Admin</p>
                      : <Separator className="my-2 opacity-30" />}
          {adminItems.map(renderItem)}
        </>)}
      </nav>

      <Separator className="opacity-40" />

      {/* Rodapé */}
      <div className="px-2 py-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-3 py-1">
            <RealtimeIndicator /><OfflineIndicator /><VersionIndicator />
          </div>
        )}
        {renderItem({ key: "settings", label: "Configurações", iconName: "Settings", group: "admin", playerAllowed: true })}
        <div className={`flex items-center ${collapsed ? "flex-col gap-2 pt-1" : "gap-2 px-1"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[11px] bg-primary/20 text-primary font-semibold">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{profile?.display_name || "Usuário"}</span>
            </div>
          )}
          <ThemeSelector />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={async () => { try { await signOut(); } catch {} }} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Sair</TooltipContent>
          </Tooltip>
        </div>
        {!collapsed && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] w-full justify-center mt-1">Beta v3.0</Badge>}
      </div>
    </aside>
  );
}
