import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string().default("Soccer Squad"),
    tags: z.array(z.string()).optional(),
    cta: z.enum(["download", "sorteio", "torneios", "quadras"]).default("download"),
  }),
});

export const collections = { blog };
