// ============================================================
// src/components/AppLayout.tsx  — FASE 1
// Wrapper de layout principal:
//   [Sidebar fixa] + [conteúdo scroll] + [BottomNav mobile]
// ============================================================

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { TrialBanner } from "@/components/TrialBanner";
import { ViewType } from "@/types/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface AppLayoutProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentView, onViewChange, children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { activeTeam, isTeamAdmin } = useTeams();
  const { profile } = useAuth();
  const { status: subStatus, daysUntilEnd } = useSubscription();
  const isAdmin = activeTeam ? isTeamAdmin(activeTeam.id) : false;

  // Colapsa sidebar em viewport tablet (768–1023px)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setSidebarCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Badge de notificações para BottomNav
  useEffect(() => {
    if (!activeTeam || !profile) return;
    fetchUnread();
    const ch = supabase.channel("applayout-notif")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "game_notifications", filter: `team_id=eq.${activeTeam.id}` }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeTeam?.id, profile]);

  const fetchUnread = async () => {
    if (!activeTeam || !profile) return;
    try {
      const { data } = await supabase
        .from("game_notifications")
        .select(`id, notification_reads!left(profile_id)`)
        .eq("team_id", activeTeam.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setUnreadCount(data?.filter((x: any) => !x.notification_reads?.some((r: any) => r.profile_id === profile.id)).length || 0);
    } catch {}
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar — desktop/tablet */}
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />

      {/* Área de conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Banner de trial gratuito */}
        {subStatus === "trialing" && daysUntilEnd !== null && (
          <TrialBanner
            daysRemaining={daysUntilEnd}
            onSubscribe={() => onViewChange("settings")}
          />
        )}
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden stadium-bg">
          {/* pb-24 md:pb-8 → espaço para BottomNav no mobile */}
          <div className="px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8 view-enter">
            {children}
          </div>
        </main>
      </div>

      {/* BottomNav — mobile */}
      <BottomNav
        currentView={currentView}
        onViewChange={onViewChange}
        unreadCount={unreadCount}
        isAdmin={isAdmin}
      />
    </div>
  );
}
