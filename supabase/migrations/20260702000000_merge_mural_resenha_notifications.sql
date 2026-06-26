-- ============================================================
-- Mural e Resenha foram mescladas em uma única página ("Resenha")
-- no frontend (team_announcements + team_feed_posts continuam como
-- tabelas separadas — só a UI foi unificada). Esta migration garante
-- que toda mensagem/aviso/enquete publicada também seja replicada
-- como notificação (mesmo canal exibido no Dashboard via
-- GameNotifications), para que ninguém perca o que rola na Resenha.
-- ============================================================

ALTER TABLE public.game_notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.game_notifications ADD CONSTRAINT valid_notification_type
  CHECK (notification_type IN ('game_finished', 'game_cancelled', 'mvp_voting', 'other', 'payment_due', 'flex_call', 'feed_post'));

CREATE OR REPLACE FUNCTION public.notify_team_feed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
BEGIN
  SELECT COALESCE(p.nickname, p.name, pr.display_name, 'Alguém')
    INTO v_author_name
  FROM public.profiles pr
  LEFT JOIN public.players p ON p.profile_id = pr.id AND p.team_id = NEW.team_id
  WHERE pr.id = NEW.profile_id;

  INSERT INTO public.game_notifications (team_id, title, message, notification_type, metadata)
  VALUES (
    NEW.team_id,
    'Nova mensagem na Resenha',
    COALESCE(v_author_name, 'Alguém') || ': ' || left(NEW.content, 140),
    'feed_post',
    jsonb_build_object('kind', 'feed_message', 'post_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_feed_post ON public.team_feed_posts;
CREATE TRIGGER trg_notify_team_feed_post
AFTER INSERT ON public.team_feed_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_team_feed_post();

CREATE OR REPLACE FUNCTION public.notify_team_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
  v_title text;
BEGIN
  SELECT COALESCE(p.nickname, p.name, pr.display_name, 'Administrador')
    INTO v_author_name
  FROM public.profiles pr
  LEFT JOIN public.players p ON p.profile_id = pr.id AND p.team_id = NEW.team_id
  WHERE pr.id = NEW.author_profile_id;

  v_title := CASE WHEN NEW.poll_options IS NOT NULL THEN 'Nova enquete na Resenha' ELSE 'Novo aviso na Resenha' END;

  INSERT INTO public.game_notifications (team_id, title, message, notification_type, metadata)
  VALUES (
    NEW.team_id,
    v_title,
    COALESCE(v_author_name, 'Administrador') || ': ' || left(NEW.body, 140),
    'feed_post',
    jsonb_build_object('kind', 'announcement', 'announcement_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_announcement ON public.team_announcements;
CREATE TRIGGER trg_notify_team_announcement
AFTER INSERT ON public.team_announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_team_announcement();
