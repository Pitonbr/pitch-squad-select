// ============================================================
// src/pages/Pricing.tsx
// Página de preços exibida após criar um novo time
// ============================================================

import { useNavigate } from "react-router-dom";
import { PricingPlans } from "@/components/payment/PricingPlans";

export default function Pricing() {
  const navigate = useNavigate();

  const pending = (() => {
    try { return JSON.parse(localStorage.getItem("pending_pricing_team") ?? "{}"); } catch { return {}; }
  })();

  const teamName = pending?.name ?? "Seu time";

  const handleSkip = () => {
    localStorage.removeItem("pending_pricing_team");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen stadium-bg flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-safe pt-4 pb-2">
        <img
          src="/icons/icon-72x72.png"
          alt="Soccer Squad"
          className="h-8 w-8 rounded-lg object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span className="text-sm font-semibold text-white/80">Soccer Squad</span>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <PricingPlans
          teamName={teamName}
          onSkip={import.meta.env.DEV ? handleSkip : undefined}
        />
      </div>
    </div>
  );
}
