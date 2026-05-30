// ============================================================
// src/components/BottomNav.tsx  — FASE 1
// Bottom navigation bar para mobile (<768px)
// 5 itens principais + badge de notificação no Dashboard
// ============================================================

import { Badge } from "@/components/ui/badge";
import { ViewType, BOTTOM_NAV_ITEMS, NAV_ITEMS } from "@/types/navigation";
import { LayoutDashboard, Users, Calendar, Play, Award } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Calendar, Play, Award,
};

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  unreadCount?: number;
}

export function BottomNav({ currentView, onViewChange, unreadCount = 0 }: BottomNavProps) {
  const items = BOTTOM_NAV_ITEMS
    .map(key => NAV_ITEMS.find(n => n.key === key))
    .filter(Boolean) as typeof NAV_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
          const isActive = currentView === item.key;
          const showBadge = item.key === "dashboard" && unreadCount > 0;

          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150",
                "focus:outline-none active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />}
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform duration-150 ${isActive ? "scale-110" : ""}`} aria-hidden="true" />
                {showBadge && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[9px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${isActive ? "text-primary" : ""}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
