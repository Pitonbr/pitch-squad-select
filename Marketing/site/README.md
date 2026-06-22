# Soccer Squad — Site de Marketing (Astro + Copa 2026)

Site estático de alta performance para divulgação e download do app Soccer Squad.
Construído em **Astro 5** com React Islands para componentes interativos.

## Stack

| Camada | Ferramenta |
|---|---|
| Framework | Astro 5 (SSG, zero JS por padrão) |
| Interatividade | React Islands (sorteio de times, form de leads) |
| Estilo | Tailwind CSS (tokens da marca Copa 2026) |
| Blog (futuro) | MDX via Content Collections |
| Leads B2B | Supabase REST API (tabela partner_leads) |
| Deploy | Vercel (free tier) |

## Setup local

```bash
git clone <este-repo>
cd soccersquad-site
npm install
npm run dev        # http://localhost:4321
npm run build      # gera dist/ (estático)
npm run preview    # preview do build
```

## Estrutura de pastas

```
src/
├── components/
│   ├── react/          # React Islands (hydrated client-side)
│   │   ├── SorteioTool.tsx
│   │   └── LeadForm.tsx
│   └── StoreBadges.astro
├── content/
│   └── blog/           # Futuros artigos MDX
├── layouts/
│   └── Base.astro      # Layout base (header, footer, SEO, GTM)
├── lib/
│   └── constants.ts    # Links das lojas, preços, dados centralizados
├── pages/
│   ├── index.astro     # Homepage
│   ├── ao-vivo.astro   # Partida ao vivo (diferencial)
│   ├── torneios.astro  # Torneios + campanha Copa 2026
│   ├── sorteio.astro   # Ferramenta grátis (SEO magnet)
│   ├── quadras.astro   # B2B para donos de quadra
│   └── planos.astro    # Preços
└── styles/
    └── global.css      # Tailwind + animações
```

## Antes de publicar (checklist)

### Links do app (trocar placeholders)
- [ ] `src/lib/constants.ts` — URLs da App Store e Google Play
- [ ] `src/lib/constants.ts` — Número do WhatsApp comercial
- [ ] `src/layouts/Base.astro` — apple-itunes-app e google-play-app IDs
- [ ] `src/components/react/LeadForm.tsx` — SUPABASE_URL e SUPABASE_ANON
- [ ] `src/components/react/SorteioTool.tsx` — URLs das lojas no upsell

### Assets visuais
- [ ] `public/img/og-cover.png` — Capa OG 1200×630 (Faixa 26 + escudo)
- [ ] `public/favicon.svg` — Substituir pelo favicon real da marca
- [ ] Logo do Soccer Squad no header (substituir "SS" por `<img>`)

### Tracking e SEO
- [ ] GTM snippet no Base.astro (descomentar e trocar GTM-XXXXXX)
- [ ] Google Search Console — verificar domínio e enviar sitemap
- [ ] Nota real da loja substituindo 4,8★ na homepage

### Supabase
- [ ] Rodar migration `partner_leads` no SQL Editor (arquivo da v2)
- [ ] Confirmar RLS: anon só INSERT, nunca SELECT

### Deploy
- [ ] Conectar repo ao Vercel
- [ ] Apontar domínio soccersquad.com.br (ou subdomínio)
- [ ] Verificar que `npm run build` gera HTML estático de todas as páginas

## Performance esperada

Com Astro SSG, o site deve atingir:
- Lighthouse Performance: 95-100
- Time to Interactive: < 1s
- Largest Contentful Paint: < 1.5s
- Zero JS nas páginas estáticas (só os Islands carregam React)

Isso coloca o Soccer Squad à frente do Chega+ (Wix, lento) e do FutBora
(SSR com hydration) nos Core Web Vitals — fator de ranking do Google.

## Estratégia de conteúdo SEO (fase 2)

8 artigos MDX no `src/content/blog/` atacando os clusters de busca
que o FutBora domina:

1. Como organizar uma pelada de futebol do zero
2. Sorteio de times justo: 5 métodos que funcionam
3. Controle financeiro da pelada sem constrangimento
4. Regras do futebol society: guia completo 2026
5. Como montar um torneio entre amigos
6. Melhores apps para organizar pelada em 2026 (comparativo)
7. Ranking de pelada: como gamificar o futebol amador
8. Como encontrar quadra de futebol perto de mim
