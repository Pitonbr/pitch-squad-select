// ============================================================
// src/types/onboarding.ts
// Tipos e interfaces para o fluxo de onboarding completo
// ============================================================

export type OnboardingStep =
  | "invite_welcome"        // A.1 — jogador com convite
  | "personal_step1"        // Cadastro: nome, apelido, foto, nascimento
  | "personal_step2"        // Cadastro: camisa, posição, pé
  | "personal_step3"        // Cadastro: altura, peso
  | "sticker_preview"       // A.4 — figurinha do jogador
  | "intent"                // B.2 — o que quer fazer? (3 opções)
  | "location"              // B.3.1 — onde mora (sub-fluxo buscar time)
  | "availability"          // B.3.2 — disponibilidade
  | "game_type"             // B.3.3 — tipo de jogo
  | "searching"             // B.3.4 — buscando
  | "results"               // B.3.5 — resultados
  | "request_sent"          // B.3.6 — solicitação enviada
  | "no_results"            // B.3.7 — sem resultado
  | "create_team_basics"    // B.4.1 — wizard de time, etapa 1/5
  | "create_team_location"  // B.4.2 — etapa 2/5
  | "create_team_schedule"  // B.4.3 — etapa 3/5
  | "create_team_ratings"   // B.4.4 — etapa 4/5
  | "create_team_review"    // B.4.5 — etapa 5/5
  | "done";

export type PlayerIntent = "find_game" | "create_team" | "stay_player";

export type TeamCategory = "masculino" | "feminino" | "mista";

export interface TeamFormData {
  name: string;
  description?: string;
  logo_url?: string;
  category: TeamCategory;
  state: string;
  city: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  game_type: GameType;
  usual_days: DayOfWeek[];
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  rating_window_hours: number; // 2–23
  rating_scale: 5 | 10;
  is_public: boolean;
  accepting_players: boolean;
}

export const RATING_WINDOW_PRESETS: { hours: number; emoji: string; label: string; description: string }[] = [
  { hours: 2,  emoji: "⚡", label: "Resultado rápido",     description: "Para grupos ansiosos que querem ver o ranking logo após o jogo." },
  { hours: 6,  emoji: "⚖️", label: "Equilibrado",          description: "Tempo suficiente para votar com calma, mas sem esperar muito." },
  { hours: 12, emoji: "🧠", label: "Pensar antes de votar", description: "Ideal para quem gosta de refletir e dar notas mais justas." },
  { hours: 23, emoji: "🌙", label: "Pelada noturna",        description: "Para quem joga à noite e prefere avaliar no dia seguinte." },
];

export type FieldPosition =
  | "GK" | "LD" | "LE" | "ZAG" | "VOL" | "MEI" | "PD" | "PE" | "ATA";

export type PreferredFoot = "right" | "left";

export type GameType = "campo" | "society" | "futsal" | "beach";

export type DayOfWeek = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type TimeSlot = "morning" | "afternoon" | "evening";

export type GamesPerWeek = "1" | "2" | "3+";

export interface PersonalData {
  full_name: string;
  nickname: string;
  photo_url?: string;
  birth_date?: string;
  jersey_number?: number;
  positions: FieldPosition[];
  preferred_foot?: PreferredFoot;
  height_cm?: number;
  weight_kg?: number;
}

export interface LocationPreferences {
  state: string;
  city: string;
  neighborhood: string;
  lat?: number;
  lng?: number;
}

export interface AvailabilityPreferences {
  days: DayOfWeek[];
  time_slots: TimeSlot[];
  games_per_week: GamesPerWeek;
}

export interface GamePreferences {
  game_types: GameType[];
}

export interface OnboardingState {
  step: OnboardingStep;
  invite_code?: string;
  invite_team?: InviteTeamInfo;
  personal?: Partial<PersonalData>;
  intent?: PlayerIntent;
  location?: LocationPreferences;
  availability?: AvailabilityPreferences;
  game_preferences?: GamePreferences;
  search_results?: TeamSearchResult[];
  selected_team?: TeamSearchResult;
  team_draft?: Partial<TeamFormData>;
}

export interface InviteTeamInfo {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  city?: string;
  state?: string;
  player_count?: number;
  next_game?: string;
  admin_name?: string;
}

export interface TeamSearchResult {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  game_type?: GameType;
  usual_days?: string[];
  usual_time?: string;
  player_count?: number;
  open_spots?: number;
  next_game_date?: string;
  next_game_time?: string;
  next_game_location?: string;
  distance_km?: number;
  compatibility_score?: number;
  invite_code?: string;
}

export interface POSITION_INFO {
  code: FieldPosition;
  label: string;
  zone: "defense" | "midfield" | "attack";
  shortLabel: string;
}

export const POSITIONS: POSITION_INFO[] = [
  { code: "GK",  label: "Goleiro",         shortLabel: "GOL", zone: "defense"  },
  { code: "LD",  label: "Lateral Direito", shortLabel: "LAT", zone: "defense"  },
  { code: "LE",  label: "Lateral Esquerdo",shortLabel: "LAT", zone: "defense"  },
  { code: "ZAG", label: "Zagueiro",        shortLabel: "ZAG", zone: "defense"  },
  { code: "VOL", label: "Volante",         shortLabel: "VOL", zone: "midfield" },
  { code: "MEI", label: "Meia",            shortLabel: "MEI", zone: "midfield" },
  { code: "PD",  label: "Ponta Direita",   shortLabel: "PON", zone: "attack"   },
  { code: "PE",  label: "Ponta Esquerda",  shortLabel: "PON", zone: "attack"   },
  { code: "ATA", label: "Atacante",        shortLabel: "ATA", zone: "attack"   },
];

export const GAME_TYPE_INFO: Record<GameType, { label: string; emoji: string; description: string }> = {
  campo:   { label: "Campo",       emoji: "🌿", description: "11 jogadores · Grama natural" },
  society: { label: "Society",     emoji: "⬡",  description: "7 jogadores · Grama sintética" },
  futsal:  { label: "Futsal",      emoji: "🏟️", description: "5 jogadores · Quadra coberta" },
  beach:   { label: "Beach Soccer",emoji: "🏖️", description: "5 jogadores · Areia" },
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua",
  qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};

export const TIME_SLOT_INFO: Record<TimeSlot, { label: string; emoji: string; range: string }> = {
  morning:   { label: "Manhã",  emoji: "🌅", range: "06h–12h" },
  afternoon: { label: "Tarde",  emoji: "☀️",  range: "12h–18h" },
  evening:   { label: "Noite",  emoji: "🌙", range: "18h–23h" },
};

export const BRAZIL_STATES = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO",
  "MA","MG","MS","MT","PA","PB","PE","PI","PR",
  "RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];
