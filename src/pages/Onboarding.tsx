// ============================================================
// src/pages/Onboarding.tsx
// Página wrapper do onboarding — detecta invite code na URL
// ============================================================

import { useSearchParams, useParams } from "react-router-dom";
import { OnboardingRouter } from "@/components/onboarding/OnboardingRouter";
import { getPendingInviteCode } from "@/hooks/useInviteCode";

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const { code: paramCode } = useParams<{ code?: string }>();

  // Priority: URL param > query string > localStorage
  const inviteCode =
    paramCode ??
    searchParams.get("invite") ??
    getPendingInviteCode() ??
    undefined;

  return <OnboardingRouter inviteCode={inviteCode} />;
}
