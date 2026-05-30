-- ============================================================
-- Adiciona colunas necessárias para busca de times e onboarding
-- ============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS neighborhood      text,
  ADD COLUMN IF NOT EXISTS game_type         text,
  ADD COLUMN IF NOT EXISTS usual_days        text[],
  ADD COLUMN IF NOT EXISTS usual_time        text,
  ADD COLUMN IF NOT EXISTS accepting_players boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS latitude          numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitude         numeric(10, 7);

-- Index for geo search
CREATE INDEX IF NOT EXISTS idx_teams_city_state
  ON public.teams(city, state);

CREATE INDEX IF NOT EXISTS idx_teams_accepting
  ON public.teams(accepting_players)
  WHERE accepting_players = true;

-- ── team_challenges (desafios entre times) ───────────────────
CREATE TABLE IF NOT EXISTS public.team_challenges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id  uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenged_team_id  uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','paid','cancelled')),
  payment_session_id  text,  -- Stripe session para cobrança dos R$20
  game_id             uuid REFERENCES public.games(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_challenges_challenger ON public.team_challenges(challenger_team_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_challenged ON public.team_challenges(challenged_team_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_status     ON public.team_challenges(status);

ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their challenges"
  ON public.team_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id IN (challenger_team_id, challenged_team_id)
        AND tm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Team admin can create challenges"
  ON public.team_challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = challenger_team_id
        AND tm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        AND tm.role = 'admin'
    )
  );

CREATE POLICY "Team admin can update challenges"
  ON public.team_challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id IN (challenger_team_id, challenged_team_id)
        AND tm.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        AND tm.role = 'admin'
    )
  );

CREATE POLICY "Service role full access challenges"
  ON public.team_challenges FOR ALL
  USING (current_setting('role') = 'service_role');
