import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Email inválido" })
  .max(255, { message: "Email muito longo" });

export const phoneSchema = z
  .string()
  .trim()
  .min(10, { message: "Telefone deve ter pelo menos 10 dígitos" })
  .max(20, { message: "Telefone muito longo" })
  .regex(/^[\d\s()+\-]+$/, { message: "Formato de telefone inválido" });

export const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
  .max(72, { message: "Senha muito longa" });

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
  .max(100, { message: "Nome muito longo" });

// Player validation schemas
export const playerNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nome deve ter pelo menos 2 caracteres" })
  .max(100, { message: "Nome muito longo" });

export const playerNicknameSchema = z
  .string()
  .trim()
  .min(2, { message: "Apelido deve ter pelo menos 2 caracteres" })
  .max(50, { message: "Apelido muito longo" });

export const playerPositionSchema = z
  .string()
  .trim()
  .min(2, { message: "Posição inválida" })
  .max(50, { message: "Posição muito longa" });

export const jerseyNumberSchema = z
  .number()
  .int()
  .min(0, { message: "Número da camisa deve ser positivo" })
  .max(999, { message: "Número da camisa inválido" })
  .optional();

// Game validation schemas
export const gameTitleSchema = z
  .string()
  .trim()
  .min(3, { message: "Título deve ter pelo menos 3 caracteres" })
  .max(200, { message: "Título muito longo" });

export const gameLocationSchema = z
  .string()
  .trim()
  .min(3, { message: "Local deve ter pelo menos 3 caracteres" })
  .max(500, { message: "Local muito longo" });

export const gameDescriptionSchema = z
  .string()
  .trim()
  .max(1000, { message: "Descrição muito longa" })
  .optional();

// Complete validation schemas
export const playerFormSchema = z.object({
  name: playerNameSchema,
  nickname: playerNicknameSchema,
  position: playerPositionSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  jersey_number: jerseyNumberSchema,
});

export const gameFormSchema = z.object({
  title: gameTitleSchema,
  location: gameLocationSchema,
  description: gameDescriptionSchema,
  date: z.string().min(1, { message: "Data é obrigatória" }),
  time: z.string().min(1, { message: "Hora é obrigatória" }),
});

export const authLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const authSignupSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

// Helper function to format zod errors
export function formatZodError(error: z.ZodError<any>): string {
  return error.issues.map(err => err.message).join(", ");
}

// Team broadcast validation schema
export const teamBroadcastSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, { message: "Assunto deve ter pelo menos 3 caracteres" })
    .max(200, { message: "Assunto muito longo" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Mensagem deve ter pelo menos 10 caracteres" })
    .max(5000, { message: "Mensagem muito longa (máximo 5000 caracteres)" }),
  recipientType: z.union([
    z.literal("all"),
    z.literal("players"),
    z.literal("admins"),
  ]),
});

// Types for form data
export type PlayerFormData = z.infer<typeof playerFormSchema>;
export type GameFormData = z.infer<typeof gameFormSchema>;
export type AuthLoginData = z.infer<typeof authLoginSchema>;
export type AuthSignupData = z.infer<typeof authSignupSchema>;
export type TeamBroadcastData = z.infer<typeof teamBroadcastSchema>;
