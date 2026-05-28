export interface BalancePlayer {
  id: string;
  name: string;
  nickname: string;
  position: string;
  skill_level?: number;
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

/**
 * Splits players into two balanced teams using a serpentine draft based on skill_level.
 * Players without skill_level are treated as level 3 (intermediate).
 *
 * Snake draft example for 6 players sorted by skill [5,5,4,3,2,1]:
 *   Round 1: A picks #1 (5), B picks #2 (5)
 *   Round 2: B picks #3 (4), A picks #4 (3)
 *   Round 3: A picks #5 (2), B picks #6 (1)
 *   Result: A=[5,3,2]=10, B=[5,4,1]=10 — perfectly balanced
 */
export function splitTeamsBalanced(players: BalancePlayer[], count?: number): BalancedTeams {
  const pool = count ? players.slice(0, count) : [...players];

  // Sort descending by skill (unknown → 3)
  const sorted = [...pool].sort(
    (a, b) => (b.skill_level ?? 3) - (a.skill_level ?? 3)
  );

  const teamA: BalancePlayer[] = [];
  const teamB: BalancePlayer[] = [];

  sorted.forEach((player, i) => {
    // Snake draft: round = Math.floor(i/2), even rounds A first, odd rounds B first
    const round = Math.floor(i / 2);
    const pickA = round % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
    (pickA ? teamA : teamB).push(player);
  });

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
