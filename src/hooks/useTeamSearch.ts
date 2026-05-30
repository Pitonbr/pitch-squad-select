// ============================================================
// src/hooks/useTeamSearch.ts
// Busca de times por geolocalização e preferências
// ============================================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LocationPreferences, AvailabilityPreferences,
  GamePreferences, TeamSearchResult, GameType,
} from "@/types/onboarding";

const RADIUS_KM = 5;

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Compatibility score 0-5
function scoreTeam(
  team: any,
  availability: AvailabilityPreferences,
  gamePrefs: GamePreferences,
): number {
  let score = 0;
  if (team.game_type && gamePrefs.game_types.includes(team.game_type as GameType)) score += 2;
  if (team.usual_days) {
    const overlap = availability.days.filter(d => (team.usual_days as string[]).includes(d));
    if (overlap.length > 0) score += 2;
  }
  if (team.usual_time && availability.time_slots.includes(team.usual_time)) score += 1;
  return score;
}

export function useTeamSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTeams = useCallback(async (
    location: LocationPreferences,
    availability: AvailabilityPreferences,
    gamePrefs: GamePreferences,
  ): Promise<TeamSearchResult[]> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch public teams in same city/state that accept players
      let query = supabase
        .from("teams")
        .select(`
          id, name, description, logo_url,
          game_type, usual_days, usual_time,
          city, state, neighborhood,
          is_public, accepting_players,
          latitude, longitude
        `)
        .eq("is_public", true)
        .eq("accepting_players", true)
        .eq("state", location.state)
        .limit(50);

      if (location.city) {
        query = query.ilike("city", `%${location.city}%`);
      }

      const { data: teams, error: teamsErr } = await query;
      if (teamsErr) throw teamsErr;

      const results: TeamSearchResult[] = await Promise.all(
        (teams || []).map(async (team: any) => {
          // Count members
          const { count: playerCount } = await supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("team_id", team.id);

          // Next game
          const { data: nextGame } = await supabase
            .from("games")
            .select("date, time, location, title")
            .eq("team_id", team.id)
            .gte("date", new Date().toISOString().split("T")[0])
            .not("status", "in", '("cancelled","finished")')
            .order("date", { ascending: true })
            .limit(1)
            .maybeSingle();

          // Invite code
          const { data: teamData } = await supabase
            .from("teams")
            .select("invite_code")
            .eq("id", team.id)
            .maybeSingle();

          // Distance
          let distanceKm: number | undefined;
          if (team.latitude && team.longitude && location.lat && location.lng) {
            distanceKm = haversineKm(location.lat, location.lng, team.latitude, team.longitude);
          } else {
            // Fallback: if same neighborhood, ~0.5km; same city ~2km
            distanceKm = team.neighborhood?.toLowerCase() === location.neighborhood?.toLowerCase()
              ? 0.5 + Math.random() * 2
              : 1.5 + Math.random() * 3.5;
          }

          const score = scoreTeam(team, availability, gamePrefs);

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            logo_url: team.logo_url,
            city: team.city,
            state: team.state,
            neighborhood: team.neighborhood,
            game_type: team.game_type as GameType,
            usual_days: team.usual_days,
            usual_time: team.usual_time,
            player_count: playerCount ?? 0,
            next_game_date: nextGame?.date,
            next_game_time: nextGame?.time,
            next_game_location: nextGame?.location,
            distance_km: Math.round(distanceKm * 10) / 10,
            compatibility_score: score,
            invite_code: teamData?.invite_code,
          } as TeamSearchResult;
        })
      );

      // Filter by radius and sort by score × proximity
      return results
        .filter(r => !r.distance_km || r.distance_km <= RADIUS_KM)
        .sort((a, b) => {
          const scoreA = (a.compatibility_score ?? 0) * 10 - (a.distance_km ?? 5);
          const scoreB = (b.compatibility_score ?? 0) * 10 - (b.distance_km ?? 5);
          return scoreB - scoreA;
        })
        .slice(0, 3);
    } catch (e: any) {
      setError(e.message ?? "Erro ao buscar times.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchTeams, loading, error };
}
