-- ============================================================
-- Item 1.11: Agendamento Automático de jogos recorrentes
-- Admin cadastra um "molde" (dia da semana + horário + local) e o
-- app materializa as próximas N semanas em games reais sempre que
-- alguém do time abre a tela de Jogos — não há cron/job no servidor
-- nesta base, então a geração é "lazy", disparada pelo cliente.
-- ============================================================

CREATE TABLE public.recurring_game_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo .. 6=sábado, igual Date.getDay()
  time time NOT NULL,
  location text NOT NULL,
  description text,
  checkin_deadline_minutes integer NOT NULL DEFAULT 30,
  max_outfield_players integer,
  max_goalkeepers integer,
  weeks_ahead integer NOT NULL DEFAULT 4 CHECK (weeks_ahead BETWEEN 1 AND 12),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS recurring_schedule_id uuid REFERENCES public.recurring_game_schedules(id) ON DELETE SET NULL;

ALTER TABLE public.recurring_game_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view recurring schedules" ON public.recurring_game_schedules
  FOR SELECT USING (is_team_member(auth.uid(), team_id));
CREATE POLICY "Team admins manage recurring schedules" ON public.recurring_game_schedules
  FOR ALL USING (is_team_admin(auth.uid(), team_id));

CREATE TRIGGER recurring_schedules_updated_at
  BEFORE UPDATE ON public.recurring_game_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Materializa as próximas ocorrências de todos os agendamentos
-- ativos do time. Idempotente: nunca duplica uma data já gerada para
-- o mesmo agendamento. Qualquer membro do time pode disparar (só
-- materializa o que um admin já configurou, não cria conteúdo livre).
CREATE OR REPLACE FUNCTION public.generate_recurring_games(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule     record;
  v_cursor_date  date;
  v_horizon      date;
  v_created      integer := 0;
BEGIN
  IF NOT is_team_member(auth.uid(), p_team_id) THEN
    RAISE EXCEPTION 'Apenas membros do time podem gerar os jogos recorrentes';
  END IF;

  FOR v_schedule IN
    SELECT * FROM public.recurring_game_schedules
    WHERE team_id = p_team_id AND active = true
  LOOP
    v_horizon := CURRENT_DATE + (v_schedule.weeks_ahead * 7);
    v_cursor_date := CURRENT_DATE;

    -- avança até o próximo dia da semana configurado (ou hoje, se já for o dia)
    WHILE EXTRACT(DOW FROM v_cursor_date) <> v_schedule.day_of_week LOOP
      v_cursor_date := v_cursor_date + 1;
    END LOOP;

    WHILE v_cursor_date <= v_horizon LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.games
        WHERE recurring_schedule_id = v_schedule.id AND date = v_cursor_date
      ) THEN
        INSERT INTO public.games (
          team_id, title, date, time, location, description, status,
          checkin_deadline_minutes, max_outfield_players, max_goalkeepers,
          recurring_schedule_id
        ) VALUES (
          v_schedule.team_id, v_schedule.title, v_cursor_date, v_schedule.time,
          v_schedule.location, v_schedule.description, 'scheduled',
          v_schedule.checkin_deadline_minutes, v_schedule.max_outfield_players,
          v_schedule.max_goalkeepers, v_schedule.id
        );
        v_created := v_created + 1;
      END IF;
      v_cursor_date := v_cursor_date + 7;
    END LOOP;
  END LOOP;

  RETURN v_created;
END;
$$;
