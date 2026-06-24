export interface BalancePlayer {
  id: string;
  name: string;
  nickname: string;
  position: string;
  skill_level?: number;
  avg_rating?: number;
  profile_image?: string;
  phone?: string;
  checkedIn?: boolean;
}

export interface BalancedTeams {
  teamA: BalancePlayer[];
  teamB: BalancePlayer[];
  skillA: number;
  skillB: number;
  diff: number;
}

export type BalanceCriterion = 'skill_level' | 'avg_rating' | 'position';

export interface BalanceOptions {
  /** Critérios combináveis usados para ordenar o draft. "position" não pontua
   *  o jogador — em vez disso, faz o sorteio dentro de cada posição
   *  separadamente, para que os dois times saiam com a mesma mistura. */
  criteria?: BalanceCriterion[];
  /** Goleiros "fixos": player_id -> time, atribuídos antes do sorteio do
   *  restante, para o admin garantir o goleiro de cada lado. */
  fixedGoalkeepers?: Record<string, 'teamA' | 'teamB'>;
}

// avg_rating é 0-10; normalizamos para a mesma escala de skill_level (1-5)
// para que os dois critérios pesem de forma comparável quando combinados.
function compositeScore(player: BalancePlayer, criteria: BalanceCriterion[]): number {
  const useSkill = criteria.includes('skill_level');
  const useRating = criteria.includes('avg_rating') && player.avg_rating != null;

  if (useSkill && useRating) {
    return ((player.skill_level ?? 3) + player.avg_rating! / 2) / 2;
  }
  if (useRating) return player.avg_rating! / 2;
  return player.skill_level ?? 3;
}

function snakeDraft(
  sorted: BalancePlayer[],
  teamA: BalancePlayer[],
  teamB: BalancePlayer[],
  startIndex: number
) {
  sorted.forEach((player, i) => {
    const globalIndex = startIndex + i;
    const round = Math.floor(globalIndex / 2);
    const pickA = round % 2 === 0 ? globalIndex % 2 === 0 : globalIndex % 2 === 1;
    (pickA ? teamA : teamB).push(player);
  });
}

/**
 * Divide jogadores em dois times equilibrados via draft em serpentina.
 * Critérios combináveis: nível de habilidade, avaliação média e posição
 * (quando "position" está nos critérios, cada grupo de posição é sorteado
 * separadamente, garantindo a mesma mistura de posições nos dois times).
 * Goleiros em `fixedGoalkeepers` são atribuídos antes do sorteio do resto.
 */
export function splitTeamsBalanced(
  players: BalancePlayer[],
  options: BalanceOptions = {}
): BalancedTeams {
  const criteria = options.criteria?.length ? options.criteria : ['skill_level'];
  const fixed = options.fixedGoalkeepers ?? {};

  const teamA: BalancePlayer[] = [];
  const teamB: BalancePlayer[] = [];

  const pool = players.filter(p => !fixed[p.id]);
  for (const player of players) {
    if (fixed[player.id] === 'teamA') teamA.push(player);
    else if (fixed[player.id] === 'teamB') teamB.push(player);
  }

  const byScoreDesc = (a: BalancePlayer, b: BalancePlayer) =>
    compositeScore(b, criteria) - compositeScore(a, criteria);

  if (criteria.includes('position')) {
    const groups = new Map<string, BalancePlayer[]>();
    for (const player of pool) {
      const key = player.position || 'Outro';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(player);
    }
    for (const group of groups.values()) {
      const sorted = [...group].sort(byScoreDesc);
      // continua a serpentina a partir do tamanho atual dos times, para que
      // a alternância A/B não recomece do zero em cada grupo de posição.
      snakeDraft(sorted, teamA, teamB, teamA.length + teamB.length);
    }
  } else {
    const sorted = [...pool].sort(byScoreDesc);
    snakeDraft(sorted, teamA, teamB, teamA.length + teamB.length);
  }

  const sum = (arr: BalancePlayer[]) =>
    arr.reduce((acc, p) => acc + (p.skill_level ?? 3), 0);

  const skillA = sum(teamA);
  const skillB = sum(teamB);

  return { teamA, teamB, skillA, skillB, diff: Math.abs(skillA - skillB) };
}

/**
 * Random balanced selection: picks `count` players from the pool,
 * weighted towards having at least 1 goalkeeper per 11 players.
 */
export function randomBalancedSelection(players: BalancePlayer[], count: number): string[] {
  const goalkeepers = players.filter(p => p.position === 'Goleiro');
  const outfield = players.filter(p => p.position !== 'Goleiro');

  const teamsOf11 = Math.floor(count / 11);
  const gkCount = Math.min(teamsOf11 * 1, goalkeepers.length);
  const fieldCount = count - gkCount;

  const shuffleGK = [...goalkeepers].sort(() => 0.5 - Math.random()).slice(0, gkCount);
  const shuffleField = [...outfield].sort(() => 0.5 - Math.random()).slice(0, fieldCount);

  const combined = [...shuffleGK, ...shuffleField];
  // fill up if we didn't get enough
  if (combined.length < count) {
    const used = new Set(combined.map(p => p.id));
    const remainder = players
      .filter(p => !used.has(p.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, count - combined.length);
    combined.push(...remainder);
  }

  return combined.sort(() => 0.5 - Math.random()).map(p => p.id);
}
