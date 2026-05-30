// ============================================================
// src/types/navigation.ts
// Fonte única de ViewType — elimina duplicação entre
// Header.tsx (removido) e Index.tsx
// ============================================================

export type ViewType =
  | "dashboard" | "players" | "addPlayer" | "games" | "addGame"
  | "tournaments" | "liveGame" | "rankings" | "teamManager"
  | "finances" | "requests" | "joinRequests" | "audit"
  | "management" | "settings";

export interface NavItem {
  key: ViewType;
  label: string;
  iconName: string;
  playerAllowed?: boolean;
  group: "main" | "manage" | "admin";
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",   label: "Dashboard",      iconName: "LayoutDashboard", group: "main",   playerAllowed: true  },
  { key: "players",     label: "Jogadores",       iconName: "Users",           group: "main",   playerAllowed: true  },
  { key: "games",       label: "Jogos",           iconName: "Calendar",        group: "main",   playerAllowed: false },
  { key: "liveGame",    label: "Jogo Ativo",      iconName: "Play",            group: "main",   playerAllowed: true  },
  { key: "rankings",    label: "Rankings",        iconName: "Award",           group: "main",   playerAllowed: true  },
  { key: "tournaments", label: "Campeonatos",     iconName: "Trophy",          group: "main",   playerAllowed: true  },
  { key: "teamManager", label: "Gerenciar Time",  iconName: "UserCog",         group: "manage", playerAllowed: false },
  { key: "finances",    label: "Financeiro",      iconName: "DollarSign",      group: "manage", playerAllowed: true  },
  { key: "requests",    label: "Solicitações",    iconName: "UserPlus",        group: "manage", playerAllowed: false },
  { key: "joinRequests",label: "Entrar no Time",  iconName: "Users",           group: "manage", playerAllowed: false },
  { key: "audit",       label: "Auditoria",       iconName: "FileText",        group: "admin",  playerAllowed: false },
  { key: "management",  label: "Gerenciamento",   iconName: "ShieldCheck",     group: "admin",  playerAllowed: false },
];

export const BOTTOM_NAV_ITEMS: ViewType[] = [
  "dashboard", "players", "games", "liveGame", "rankings",
];
