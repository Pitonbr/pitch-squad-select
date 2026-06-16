import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBanners, type ActiveBanner } from "@/hooks/useBanners";
import { X, ExternalLink } from "lucide-react";

interface AdBannerProps {
  target?: string;
  className?: string;
}

function trackEvent(bannerId: string, event: "impression" | "click") {
  supabase.rpc("track_banner_event", { p_banner_id: bannerId, p_event: event }).then();
}

function BannerCard({
  banner,
  onDismiss,
}: {
  banner: ActiveBanner;
  onDismiss: (id: string) => void;
}) {
  const tracked  = useRef(false);
  const hasLink  = !!banner.link_url;

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent(banner.id, "impression");
  }, [banner.id]);

  const handleClick = () => {
    if (!hasLink) return;
    trackEvent(banner.id, "click");
    window.open(banner.link_url!, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/60 group">
      {/* Dismiss button */}
      <button
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors"
        onClick={() => onDismiss(banner.id)}
        aria-label="Fechar banner"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Image */}
      <div
        className={`relative w-full overflow-hidden ${hasLink ? "cursor-pointer" : ""}`}
        style={{ aspectRatio: "16/5" }}
        onClick={hasLink ? handleClick : undefined}
      >
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {/* Gradient overlay for CTA */}
        {hasLink && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 flex items-center justify-end pr-4">
            <span className="flex items-center gap-1.5 bg-white/90 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              {banner.link_text ?? "Saiba mais"}
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="absolute bottom-2 left-3">
        <span className="text-white/50 text-[10px] uppercase tracking-widest">Publicidade</span>
      </div>
    </div>
  );
}

export function AdBanner({ target = "dashboard", className }: AdBannerProps) {
  const { data: banners = [] } = useBanners(target);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("dismissed_banners");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem("dismissed_banners", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Show one banner at a time (rotate via index)
  const banner = visible[0];

  return (
    <div className={className}>
      <BannerCard banner={banner} onDismiss={dismiss} />
    </div>
  );
}
