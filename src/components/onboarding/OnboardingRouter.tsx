// ============================================================
// src/components/onboarding/OnboardingRouter.tsx
// Roteador central do onboarding — máquina de estados visual
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingFlow, markOnboardingDone } from "@/hooks/useOnboardingFlow";
import { useInviteCode }     from "@/hooks/useInviteCode";
import { useTeamSearch }     from "@/hooks/useTeamSearch";
import { useTeams }          from "@/hooks/useTeams";
import { useAuth }           from "@/hooks/useAuth";
import { useToast }          from "@/hooks/use-toast";
import { supabase }          from "@/integrations/supabase/client";
import { PersonalData, TeamSearchResult, TeamFormData } from "@/types/onboarding";

import { InviteWelcome }        from "./InviteWelcome";
import { PersonalRegistration } from "./PersonalRegistration";
import { PlayerSticker }        from "./PlayerSticker";
import { IntentSelector }       from "./IntentSelector";
import { LocationForm }         from "./LocationForm";
import { AvailabilityForm }     from "./AvailabilityForm";
import { GameTypeSelector }     from "./GameTypeSelector";
import { SearchingScreen }      from "./SearchingScreen";
import { MatchResults }         from "./MatchResults";
import { RequestConfirmation }  from "./RequestConfirmation";
import { NoResultsScreen }      from "./NoResultsScreen";
import { TeamStepBasics }       from "./TeamStepBasics";
import { TeamStepLocation }     from "./TeamStepLocation";
import { TeamStepSchedule }     from "./TeamStepSchedule";
import { TeamStepRatings }      from "./TeamStepRatings";
import { TeamStepReview }       from "./TeamStepReview";

interface OnboardingRouterProps {
  inviteCode?: string;
}

export function OnboardingRouter({ inviteCode }: OnboardingRouterProps) {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { joinTeamByCode, createTeam } = useTeams();
  const { searchTeams } = useTeamSearch();

  const flow = useOnboardingFlow(inviteCode);
  const { state } = flow;

  const invite = useInviteCode(
    state.step === "invite_welcome" ? inviteCode : undefined
  );

  // ── Auto-run search when entering "searching" step ──────────
  useEffect(() => {
    if (state.step !== "searching") return;
    if (!state.location || !state.availability || !state.game_preferences) {
      flow.goTo("location"); return;
    }
    let cancelled = false;
    (async () => {
      const results = await searchTeams(state.location!, state.availability!, state.game_preferences!);
      if (!cancelled) flow.setSearchResults(results);
    })();
    return () => { cancelled = true; };
  }, [state.step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helper: mark done + finish ───────────────────────────────
  const done = () => {
    if (user?.id) markOnboardingDone(user.id);
    flow.finish(user?.id);
  };

  // ── Redirect when done ───────────────────────────────────────
  useEffect(() => {
    if (state.step !== "done") return;
    const pending = localStorage.getItem("post_onboarding_redirect");
    if (pending) {
      localStorage.removeItem("post_onboarding_redirect");
      navigate(pending, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [state.step, navigate]);

  // ── Save player profile to DB ────────────────────────────────
  const savePlayerProfile = async (data: Partial<PersonalData>): Promise<void> => {
    if (!profile) return;
    try {
      await supabase.from("profiles").update({
        display_name: data.full_name ?? profile.display_name,
      }).eq("id", profile.id);
    } catch { /* non-critical */ }
  };

  // ── Add player to team in DB ─────────────────────────────────
  const joinTeamWithProfile = async (teamInviteCode: string): Promise<boolean> => {
    return joinTeamByCode(teamInviteCode);
  };

  // ── Send join request ────────────────────────────────────────
  const sendJoinRequest = async (team: TeamSearchResult): Promise<void> => {
    if (!profile) return;
    try {
      // requesting_player_id is the correct column name in team_join_requests
      const { error } = await supabase.from("team_join_requests").insert({
        team_id:               team.id,
        requesting_player_id:  profile.id,
        status:                "pending",
        message:               "Solicitação de entrada via busca de jogos.",
      });
      if (error) throw error;

      // Push notification via existing function (no game_id required)
      supabase.functions.invoke("send-join-request-notification", {
        body: { team_id: team.id, player_name: profile.display_name ?? "Um jogador" },
      }).catch(() => {}); // fire and forget, non-critical

      flow.selectTeam(team);
      flow.confirmRequest();
    } catch {
      toast({ title: "Erro ao enviar solicitação", description: "Tente novamente.", variant: "destructive" });
    }
  };

  // ── Create team ───────────────────────────────────────────────
  // Time só ganha acesso de admin (e cobrança) depois do checkout no
  // Stripe ser concluído — o webhook é quem promove pending_payment → trialing.
  const [creatingTeam, setCreatingTeam] = useState(false);

  const handleCreateTeam = async (data: TeamFormData): Promise<void> => {
    setCreatingTeam(true);
    try {
      const team = await createTeam(data.name, data.description);
      if (!team) { setCreatingTeam(false); return; }

      const { error } = await supabase.from("teams").update({
        state:                data.state,
        city:                 data.city,
        neighborhood:         data.neighborhood ?? null,
        address:              data.address ?? null,
        latitude:             data.lat ?? null,
        longitude:            data.lng ?? null,
        category:             data.category,
        game_type:            data.game_type,
        usual_days:           data.usual_days,
        start_time:           data.start_time,
        end_time:             data.end_time,
        rating_window_hours:  data.rating_window_hours,
        rating_scale:         data.rating_scale,
        is_public:            true,
        accepting_players:    true,
        logo_url:             data.logo_url ?? null,
        subscription_status:  "pending_payment",
      }).eq("id", team.id);
      if (error) throw error;

      localStorage.setItem("pending_pricing_team", JSON.stringify({ id: team.id, name: team.name }));
      localStorage.setItem("post_onboarding_redirect", "/pricing");
      if (user?.id) markOnboardingDone(user.id);
      flow.finish(user?.id);
    } catch {
      toast({ title: "Erro ao criar o time", description: "Tente novamente.", variant: "destructive" });
      setCreatingTeam(false);
    }
  };

  // ── Personal steps shared logic ───────────────────────────────
  // Após personal_step3, todo mundo (com ou sem convite) passa pela
  // figurinha antes de seguir — ver handleStickerNext.
  const handlePersonalNext = async (data: Partial<PersonalData>) => {
    flow.setPersonal(data);
    if (state.step === "personal_step3") {
      const merged = { ...state.personal, ...data } as PersonalData;
      await savePlayerProfile(merged);
    }
    flow.nextPersonalStep(data);
  };

  // ── Sticker step → decide próximo destino ──────────────────────
  const handleStickerNext = async (stickerUrl?: string) => {
    if (stickerUrl && profile) {
      try {
        await supabase.from("profiles").update({ sticker_url: stickerUrl }).eq("id", profile.id);
      } catch { /* non-critical */ }
    }

    if (state.invite_code && state.invite_team) {
      const ok = await joinTeamWithProfile(state.invite_code);
      if (ok) {
        toast({ title: `Bem-vindo ao ${state.invite_team.name}! 🎉` });
        done();
      } else {
        flow.goTo("intent");
      }
      return;
    }
    flow.goTo("intent");
  };

  // ── Layout wrapper ────────────────────────────────────────────
  return (
    <div className="min-h-screen stadium-bg flex flex-col">
      {/* Top bar with step context */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <div className="flex items-center gap-2">
          <img
            src="/icons/icon-72x72.png"
            alt="Soccer Squad"
            className="h-8 w-8 rounded-lg object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-sm font-semibold text-white/80">Soccer Squad</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* ── A.1 Invite Welcome ── */}
          {state.step === "invite_welcome" && (
            <InviteWelcome
              teamInfo={invite.teamInfo}
              loading={invite.loading}
              error={invite.error}
              onAccept={() => {
                if (invite.teamInfo) flow.setInviteTeam(invite.teamInfo);
                else flow.goTo("personal_step1");
              }}
              onDecline={() => navigate("/auth")}
            />
          )}

          {/* ── Personal steps ── */}
          {(state.step === "personal_step1" ||
            state.step === "personal_step2" ||
            state.step === "personal_step3") && (
            <PersonalRegistration
              step={state.step === "personal_step1" ? 1 : state.step === "personal_step2" ? 2 : 3}
              initial={state.personal}
              onNext={handlePersonalNext}
              onBack={state.step !== "personal_step1" ? flow.backPersonalStep : undefined}
            />
          )}

          {/* ── A.4 Figurinha do jogador ── */}
          {state.step === "sticker_preview" && (
            <PlayerSticker
              personal={state.personal}
              onNext={handleStickerNext}
              onRetakePhoto={() => flow.goTo("personal_step1")}
            />
          )}

          {/* ── B.2 Intent ── */}
          {state.step === "intent" && (
            <IntentSelector
              onSelect={(intent) => {
                if (intent === "stay_player") { done(); return; }
                flow.setIntent(intent);
              }}
            />
          )}

          {/* ── B.3.1 Location ── */}
          {state.step === "location" && (
            <LocationForm
              initial={state.location}
              onNext={flow.setLocation}
              onBack={() => flow.goTo("intent")}
            />
          )}

          {/* ── B.3.2 Availability ── */}
          {state.step === "availability" && (
            <AvailabilityForm
              initial={state.availability}
              onNext={flow.setAvailability}
              onBack={() => flow.goTo("location")}
            />
          )}

          {/* ── B.3.3 Game type ── */}
          {state.step === "game_type" && (
            <GameTypeSelector
              initial={state.game_preferences}
              onNext={flow.setGamePreferences}
              onBack={() => flow.goTo("availability")}
            />
          )}

          {/* ── B.3.4 Searching ── */}
          {state.step === "searching" && <SearchingScreen />}

          {/* ── B.3.5 Results ── */}
          {state.step === "results" && (
            <MatchResults
              results={state.search_results ?? []}
              onRequest={sendJoinRequest}
              onRetry={flow.retrySearch}
              onGoHome={flow.finish}
            />
          )}

          {/* ── B.3.6 Request sent ── */}
          {state.step === "request_sent" && (
            <RequestConfirmation
              team={state.selected_team ?? null}
              onGoHome={flow.finish}
            />
          )}

          {/* ── B.3.7 No results ── */}
          {state.step === "no_results" && (
            <NoResultsScreen
              onAdjustFilters={() => flow.goTo("location")}
              onCreateTeam={() => flow.goTo("create_team_basics")}
              onGoHome={flow.finish}
            />
          )}

          {/* ── A.3 Wizard de criação de time (5 etapas) ── */}
          {state.step === "create_team_basics" && (
            <TeamStepBasics
              initial={state.team_draft}
              onNext={flow.nextTeamStep}
              onBack={() => flow.goTo("intent")}
            />
          )}

          {state.step === "create_team_location" && (
            <TeamStepLocation
              initial={state.team_draft}
              onNext={flow.nextTeamStep}
              onBack={flow.backTeamStep}
            />
          )}

          {state.step === "create_team_schedule" && (
            <TeamStepSchedule
              initial={state.team_draft}
              onNext={flow.nextTeamStep}
              onBack={flow.backTeamStep}
            />
          )}

          {state.step === "create_team_ratings" && (
            <TeamStepRatings
              initial={state.team_draft}
              onNext={flow.nextTeamStep}
              onBack={flow.backTeamStep}
            />
          )}

          {state.step === "create_team_review" && (
            <TeamStepReview
              data={state.team_draft ?? {}}
              onEdit={flow.goTo}
              onBack={flow.backTeamStep}
              onSubmit={() => handleCreateTeam(state.team_draft as TeamFormData)}
              loading={creatingTeam}
            />
          )}
        </div>
      </div>
    </div>
  );
}
