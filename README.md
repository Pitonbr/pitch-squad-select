# Soccer Squad

Sistema completo de gestão de partidas de futebol amador: cadastro de jogadores, check-in automático, formação de times equilibradas, torneios, financeiro e site de marketing.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, banco de dados, realtime, edge functions)
- React Router + TanStack Query

## Setup local

Requisitos: Node.js 20+ (recomendado via [nvm](https://github.com/nvm-sh/nvm)).

```sh
git clone https://github.com/Pitonbr/pitch-squad-select.git
cd pitch-squad-select
npm install
cp .env.example .env   # preencher com as credenciais do projeto Supabase
npm run dev
```

O app sobe em `http://localhost:8080`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (gera `dist/`)
- `npm run preview` — serve o build de produção localmente
- `npm run lint` — checagem de lint

## Banco de dados (Supabase CLI)

Schema e tipos são gerenciados via [Supabase CLI](https://supabase.com/docs/guides/cli):

```sh
npm install -g supabase
supabase login                                  # ou export SUPABASE_ACCESS_TOKEN=...
supabase link --project-ref fupqwyzwjvlnklbazqjm
```

Workflow para mudanças de schema:

```sh
supabase migration new nome_da_mudanca   # cria arquivo em supabase/migrations/
# editar o SQL gerado
supabase db push                          # aplica no projeto remoto
supabase gen types typescript --linked --schema public > src/integrations/supabase/types.ts
```

## Deploy

O deploy de produção (`soccersquad.com.br`) é feito via GitHub Actions para a Hostinger a cada push em `main` (ver `.github/workflows/deploy.yml`).
