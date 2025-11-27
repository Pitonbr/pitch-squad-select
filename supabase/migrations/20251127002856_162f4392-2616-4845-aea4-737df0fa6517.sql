-- Função para marcar jogos não realizados automaticamente
CREATE OR REPLACE FUNCTION mark_unrealized_games()
RETURNS void AS $$
BEGIN
  -- Atualiza jogos agendados que passaram da data/hora sem serem ativados
  UPDATE games
  SET 
    status = 'not_realized',
    updated_at = now()
  WHERE status = 'scheduled'
    AND (date + time::interval) < (now() - interval '2 hours')
    AND is_match_active = false
    AND match_time_started IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;