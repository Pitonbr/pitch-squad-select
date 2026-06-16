import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  info:    { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-200",   icon: Info },
  warning: { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-200",  icon: AlertTriangle },
  error:   { bg: "bg-red-500/15",    border: "border-red-500/40",    text: "text-red-200",    icon: XCircle },
  success: { bg: "bg-emerald-500/10",border: "border-emerald-500/30",text: "text-emerald-200",icon: CheckCircle },
};

export function SystemAlertBanner() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_alerts");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ["system-alerts-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("id, title, message, type")
        .eq("is_active", true)
        .or("starts_at.is.null,starts_at.lte.now()")
        .or("ends_at.is.null,ends_at.gt.now()");
      if (error) throw error;
      return (data ?? []) as SystemAlert[];
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem("dismissed_alerts", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-1 px-2 pt-1">
      {visible.map((alert) => {
        const style = TYPE_STYLES[alert.type] ?? TYPE_STYLES.info;
        const Icon  = style.icon;
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border ${style.bg} ${style.border}`}
          >
            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${style.text}`}>{alert.title}</p>
              {alert.message && (
                <p className={`text-xs mt-0.5 opacity-80 ${style.text}`}>{alert.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className={`shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity ${style.text}`}
              aria-label="Fechar alerta"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
