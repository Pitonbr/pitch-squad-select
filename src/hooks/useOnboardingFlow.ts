// ============================================================
// src/hooks/useOnboardingFlow.ts
// Máquina de estados central do onboarding
// ============================================================

import { useState, useCallback } from "react";
import {
  OnboardingState, OnboardingStep, PersonalData,
  LocationPreferences, AvailabilityPreferences,
  GamePreferences, PlayerIntent, TeamSearchResult, InviteTeamInfo,
} from "@/types/onboarding";

const STORAGE_KEY = "onboarding_state";
const DONE_KEY    = (userId: string) => `onboarding_done_${userId}`;

/** Returns true if this user has already completed onboarding on this device. */
export function isOnboardingDone(userId: string): boolean {
  return localStorage.getItem(DONE_KEY(userId)) === "1";
}

/** Marks onboarding as permanently completed for this user. */
export function markOnboardingDone(userId: string): void {
  localStorage.setItem(DONE_KEY(userId), "1");
}

function loadState(): Partial<OnboardingState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(state: OnboardingState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function useOnboardingFlow(initialInviteCode?: string) {
  const persisted = loadState();

  const [state, setState] = useState<OnboardingState>(() => {
    if (initialInviteCode) {
      return { step: "invite_welcome", invite_code: initialInviteCode };
    }
    if (persisted.step && persisted.step !== "done") {
      return persisted as OnboardingState;
    }
    return { step: "personal_step1" };
  });

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const goTo = useCallback((step: OnboardingStep) => update({ step }), [update]);

  const setInviteTeam = useCallback((team: InviteTeamInfo) => {
    update({ invite_team: team, step: "personal_step1" });
  }, [update]);

  const setPersonal = useCallback((data: Partial<PersonalData>) => {
    setState(prev => {
      const next = { ...prev, personal: { ...prev.personal, ...data } };
      saveState(next);
      return next;
    });
  }, []);

  const setIntent = useCallback((intent: PlayerIntent) => {
    update({ intent, step: intent === "find_game" ? "location" : "create_team" });
  }, [update]);

  const setLocation = useCallback((location: LocationPreferences) => {
    update({ location, step: "availability" });
  }, [update]);

  const setAvailability = useCallback((availability: AvailabilityPreferences) => {
    update({ availability, step: "game_type" });
  }, [update]);

  const setGamePreferences = useCallback((game_preferences: GamePreferences) => {
    update({ game_preferences, step: "searching" });
  }, [update]);

  const setSearchResults = useCallback((results: TeamSearchResult[]) => {
    update({ search_results: results, step: results.length > 0 ? "results" : "no_results" });
  }, [update]);

  const selectTeam = useCallback((team: TeamSearchResult) => {
    update({ selected_team: team });
  }, [update]);

  const confirmRequest = useCallback(() => update({ step: "request_sent" }), [update]);

  const retrySearch = useCallback(() => update({ step: "searching" }), [update]);

  const finish = useCallback((userId?: string) => {
    localStorage.removeItem(STORAGE_KEY);
    if (userId) markOnboardingDone(userId);
    update({ step: "done" });
  }, [update]);

  const nextPersonalStep = useCallback((data: Partial<PersonalData>) => {
    setState(prev => {
      const next: OnboardingState = {
        ...prev,
        personal: { ...prev.personal, ...data },
        step: prev.step === "personal_step1" ? "personal_step2"
            : prev.step === "personal_step2" ? "personal_step3"
            : prev.invite_code ? "invite_welcome" // will redirect to intent after step3
            : "intent",
      };
      // After step3: if has invite → redirect to intent screen,
      // otherwise go to intent
      if (prev.step === "personal_step3") {
        next.step = "intent";
      }
      saveState(next);
      return next;
    });
  }, []);

  const backPersonalStep = useCallback(() => {
    setState(prev => {
      const next: OnboardingState = {
        ...prev,
        step: prev.step === "personal_step2" ? "personal_step1"
            : prev.step === "personal_step3" ? "personal_step2"
            : prev.step,
      };
      saveState(next);
      return next;
    });
  }, []);

  return {
    state,
    goTo,
    setInviteTeam,
    setPersonal,
    setIntent,
    setLocation,
    setAvailability,
    setGamePreferences,
    setSearchResults,
    selectTeam,
    confirmRequest,
    retrySearch,
    finish,
    nextPersonalStep,
    backPersonalStep,
  };
}
