# CLAUDE.md

Contexto para sessões futuras do Claude Code neste repositório.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, banco de dados, realtime, 13 edge functions em `supabase/functions/`)
- React Router + TanStack Query

## Estrutura

- `src/pages` — rotas da aplicação (app + site de marketing)
- `src/components`, `src/contexts`, `src/hooks`, `src/integrations`, `src/lib`, `src/utils`
- `supabase/migrations/` — 65 migrations SQL (histórico do schema)
- `supabase/functions/` — edge functions (Stripe checkout/portal/webhook, notificações por e-mail/SMS/WhatsApp)

## Workflow do Supabase CLI

Não há mais geração automática de tipos via Lovable. Para qualquer mudança de schema:

```sh
supabase migration new nome_da_mudanca   # cria arquivo em supabase/migrations/
# editar o SQL gerado
supabase db push                          # aplica no projeto remoto (fupqwyzwjvlnklbazqjm)
supabase gen types typescript --linked --schema public > src/integrations/supabase/types.ts
```

**Caveat de drift**: antes de criar uma migration nova, rode `supabase db pull` para checar se o banco remoto tem mudanças que não estão refletidas em `supabase/migrations/` (podem ter sido feitas direto no painel do Supabase).

## Deploy

Produção (`soccersquad.com.br`) via **Cloudflare Pages**, integrado ao GitHub:

- Push em `main` → `.github/workflows/deploy.yml` builda (`npm run build`) e publica `dist/` via `wrangler pages deploy` no projeto `soccersquad`.
- Secrets do repo: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Roteamento de SPA: `public/_redirects`. Headers de segurança/cache: `public/_headers`.
- `.github/workflows/ci.yml` roda lint (não-bloqueante, há débito técnico pré-existente de ~155 erros) + build em PRs para `main`.

## Git

`main` = produção, auto-deploy. O bot do Lovable (`gpt-engineer-app[bot]`) não deve mais commitar aqui — o Lovable foi desconectado deste repo.
