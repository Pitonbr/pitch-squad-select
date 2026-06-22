import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://soccersquad.com.br",
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    mdx(),
  ],
  // SSG por padrão — zero JS, máxima performance
  output: "static",
});
