-- ============================================================
-- Migration: infraestrutura do site de marketing
-- 1) site_public_stats()    — números agregados para o hero
-- 2) site_public_rankings() — top times (sem dados pessoais)
-- 3) partner_leads          — leads B2B de quadras/arenas
-- Seguro por design: funções SECURITY DEFINER expõem apenas
-- agregados; nenhum dado individual de jogador é exposto.
-- ============================================================

-- 1) Estatísticas agregadas públicas (hero do site)
create or replace function public.site_public_stats()
returns table (games_count bigint, teams_count bigint, tournaments_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*) from public.games),
    (select count(*) from public.teams),
    (select count(*) from public.tournaments);
$$;

revoke all on function public.site_public_stats() from public;
grant execute on function public.site_public_stats() to anon, authenticated;

-- 2) Ranking público: apenas nome do time, cidade e agregados de vitórias
--    games guarda o placar do ponto de vista do próprio time
--    (team_id, home_score, away_score, status) — não há home/away/winner_team_id.
create or replace function public.site_public_rankings(limit_rows int default 10)
returns table (team_name text, city text, wins bigint, games bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.name as team_name,
    t.city as city,
    count(*) filter (where g.home_score > g.away_score) as wins,
    count(*) as games
  from public.teams t
  join public.games g
    on g.team_id = t.id
  where g.status = 'finished'
  group by t.id, t.name, t.city
  having count(*) >= 5            -- só entra no ranking quem jogou de verdade
  order by wins desc, games asc
  limit greatest(limit_rows, 1);
$$;

revoke all on function public.site_public_rankings(int) from public;
grant execute on function public.site_public_rankings(int) to anon, authenticated;

-- 3) Leads B2B (quadras e arenas)
create table if not exists public.partner_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  contact_name  text not null,
  venue_name    text not null,
  city          text not null,
  whatsapp      text not null,
  email         text,
  source        text not null default 'site',
  status        text not null default 'new'   -- new | contacted | active | discarded
);

alter table public.partner_leads enable row level security;

-- Visitantes anônimos podem APENAS inserir (nunca ler/editar/apagar)
create policy "site_can_insert_partner_leads"
  on public.partner_leads
  for insert
  to anon, authenticated
  with check (true);

-- Leitura restrita: nenhuma policy de select para anon.
-- Crie uma policy de select para o papel/claim de admin do seu projeto, ex.:
-- create policy "admins_read_partner_leads"
--   on public.partner_leads for select
--   using (exists (
--     select 1 from public.profiles p
--     where p.user_id = auth.uid() and p.role = 'admin'
--   ));

-- Índice para o funil comercial
create index if not exists partner_leads_status_idx
  on public.partner_leads (status, created_at desc);
