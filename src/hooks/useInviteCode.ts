// ============================================================
// src/hooks/useInviteCode.ts
// Detecta e valida código de convite na URL
// ============================================================

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InviteTeamInfo } from "@/types/onboarding";

interface UseInviteCodeResult {
  inviteCode: string | null;
  teamInfo: InviteTeamInfo | null;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

export function useInviteCode(code?: string): UseInviteCodeResult {
  const [teamInfo, setTeamInfo] = useState<InviteTeamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    // Persist code in localStorage so it survives auth redirects
    localStorage.setItem("pending_invite_code", code);

    const validate = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: team, error: err } = await supabase
          .from("teams")
          .select("id, name, description, logo_url, invite_code")
          .eq("invite_code", code.toUpperCase())
          .maybeSingle();

        if (err || !team) {
          setError("Código de convite inválido ou expirado.");
          return;
        }

        // Count players
        const { count: playerCount } = await supabase
          .from("team_members")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team.id);

        // Get next game
        const { data: nextGame } = await supabase
          .from("games")
          .select("date, time")
          .eq("team_id", team.id)
          .gte("date", new Date().toISOString().split("T")[0])
          .not("status", "in", '("cancelled","finished")')
          .order("date", { ascending: true })
          .limit(1)
          .maybeSingle();

        // Get admin profile name
        const { data: adminMember } = await supabase
          .from("team_members")
          .select("profile_id")
          .eq("team_id", team.id)
          .eq("role", "admin")
          .maybeSingle();

        let adminName: string | undefined;
        if (adminMember?.profile_id) {
          const { data: adminProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", adminMember.profile_id)
            .maybeSingle();
          adminName = adminProfile?.display_name ?? undefined;
        }

        setTeamInfo({
          id: team.id,
          name: team.name,
          description: team.description ?? undefined,
          logo_url: team.logo_url ?? undefined,
          player_count: playerCount ?? 0,
          next_game: nextGame ? `${nextGame.date} ${nextGame.time}` : undefined,
          admin_name: adminName,
        });
      } catch {
        setError("Erro ao validar o convite. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [code]);

  return {
    inviteCode: code ?? null,
    teamInfo,
    loading,
    error,
    isValid: !!teamInfo && !error,
  };
}

export function getPendingInviteCode(): string | null {
  return localStorage.getItem("pending_invite_code");
}

export function clearPendingInviteCode() {
  localStorage.removeItem("pending_invite_code");
}
