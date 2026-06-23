-- ============================================================
-- audit_logs.team_id não deve ter FK estrita: um log de auditoria
-- é um registro histórico e precisa sobreviver à exclusão do time
-- (ex: ao excluir um time, a trigger que loga a própria exclusão
-- tentava inserir um audit_log referenciando um team_id que já não
-- existe mais — violando a FK e impedindo a exclusão do time).
-- ============================================================

ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_team_id_fkey;
