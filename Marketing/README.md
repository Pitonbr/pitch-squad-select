# Soccer Squad — Marketing (Copa 2026)

Esta pasta contém todos os materiais de marketing do Soccer Squad.

## Estrutura

```
Marketing/
├── assets/               # Assets visuais para redes sociais
│   ├── og-cover.png              # Open Graph 1200×630 (compartilhamento)
│   ├── instagram-post-1080x1080.png  # Feed Instagram/Facebook
│   └── stories-reels-1080x1920.png   # Stories/Reels/TikTok
│
├── blog/                 # 8 artigos pilares (MDX para Astro)
│   ├── config.ts                 # Content Collection config
│   ├── como-organizar-pelada.mdx
│   ├── sorteio-de-times-justo.mdx
│   ├── financeiro-pelada.mdx
│   ├── regras-futebol-society.mdx
│   ├── como-montar-torneio.mdx
│   ├── melhores-apps-pelada-2026.mdx
│   ├── ranking-pelada-gamificacao.mdx
│   └── encontrar-quadra-futebol.mdx
│
├── site/                 # Projeto Astro completo do site de marketing
│   ├── README.md                 # Setup, deploy e checklist
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tailwind.config.mjs
│   ├── tsconfig.json
│   ├── index.astro               # Homepage
│   ├── ao-vivo.astro             # Partida ao vivo
│   ├── torneios.astro            # Torneios + Copa 2026
│   ├── sorteio.astro             # Ferramenta grátis (SEO magnet)
│   ├── quadras.astro             # B2B para quadras
│   ├── planos.astro              # Preços
│   ├── components/               # Componentes compartilhados
│   ├── layouts/                  # Layout base
│   ├── lib/                      # Constantes e config
│   └── styles/                   # CSS global
│
└── videos/               # Roteiros de produção de vídeo
    ├── Soccer_Squad_Roteiros_Video_Copa2026.docx  # Word formatado
    └── roteiros-video-soccersquad.md              # Markdown de referência
```

## Status: Junho 2026

- [x] Site Astro completo (7 páginas + 2 React Islands)
- [x] 8 artigos do blog para SEO
- [x] 3 assets visuais para redes sociais
- [x] Roteiros de 3 vídeos (5 peças)
- [ ] Publicação do site (Vercel)
- [ ] Produção dos vídeos
- [ ] Trocar placeholders (links das lojas, WhatsApp, Supabase keys)
