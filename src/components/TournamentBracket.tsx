import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, Clock, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TournamentMatch } from '@/hooks/useTournaments';

interface Player {
  id: string;
  name: string;
  nickname: string;
}

interface BracketMatch extends Omit<TournamentMatch, 'status'> {
  player1?: Player;
  player2?: Player;
  winner?: Player;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentType: 'single_elimination' | 'round_robin';
  isAdmin: boolean;
  onMatchClick: (match: BracketMatch) => void;
}

export function TournamentBracket({ 
  tournamentId, 
  tournamentType, 
  isAdmin, 
  onMatchClick 
}: TournamentBracketProps) {
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round')
        .order('match_number');

      if (matchesError) throw matchesError;

      // Fetch players
      const { data: participantsData, error: participantsError } = await supabase
        .from('tournament_participants')
        .select(`
          player_id,
          players (
            id,
            name,
            nickname
          )
        `)
        .eq('tournament_id', tournamentId);

      if (participantsError) throw participantsError;

      // Create players lookup
      const playersLookup: Record<string, Player> = {};
      participantsData?.forEach((participant: any) => {
        if (participant.players) {
          playersLookup[participant.player_id] = participant.players;
        }
      });

      // Enrich matches with player data
      const enrichedMatches: BracketMatch[] = matchesData?.map(match => ({
        ...match,
        status: match.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        player1: match.player1_id ? playersLookup[match.player1_id] : undefined,
        player2: match.player2_id ? playersLookup[match.player2_id] : undefined,
        winner: match.winner_id ? playersLookup[match.winner_id] : undefined,
      })) || [];

      setMatches(enrichedMatches);
      setPlayers(playersLookup);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupMatchesByRound = () => {
    const rounds: Record<number, BracketMatch[]> = {};
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });
    return rounds;
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (tournamentType === 'round_robin') return 'Todos contra Todos';
    
    const roundsFromEnd = totalRounds - round + 1;
    switch (roundsFromEnd) {
      case 1: return 'Final';
      case 2: return 'Semifinal';
      case 3: return 'Quartas de Final';
      case 4: return 'Oitavas de Final';
      default: return `${round}ª Rodada`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tournamentType === 'round_robin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Todos contra Todos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onMatchClick(match)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[120px]">
                    <div className="font-medium">{match.player1?.name || 'TBD'}</div>
                    <div className="text-sm text-muted-foreground">{match.player1?.nickname}</div>
                  </div>
                  
                  <div className="text-center px-4">
                    {match.status === 'completed' ? (
                      <div className="text-lg font-bold">
                        {match.score1} x {match.score2}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">vs</div>
                    )}
                  </div>
                  
                  <div className="text-center min-w-[120px]">
                    <div className="font-medium">{match.player2?.name || 'TBD'}</div>
                    <div className="text-sm text-muted-foreground">{match.player2?.nickname}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getMatchStatusColor(match.status)}>
                    {match.status === 'completed' ? 'Finalizado' :
                     match.status === 'in_progress' ? 'Em Andamento' :
                     match.status === 'scheduled' ? 'Agendado' : 'Pendente'}
                  </Badge>
                  
                  {match.is_return_leg && (
                    <Badge variant="secondary">Volta</Badge>
                  )}
                  
                  {isAdmin && (
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single Elimination Bracket
  const rounds = groupMatchesByRound();
  const totalRounds = Math.max(...Object.keys(rounds).map(Number));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Chaveamento - Eliminatórias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 overflow-x-auto pb-4">
          {Object.entries(rounds)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([roundNum, roundMatches]) => (
              <div key={roundNum} className="flex-shrink-0 min-w-[280px]">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  {getRoundName(Number(roundNum), totalRounds)}
                </h3>
                
                <div className="space-y-4">
                  {roundMatches.map((match) => (
                    <Card
                      key={match.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onMatchClick(match)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Player 1 */}
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner_id === match.player1_id ? 'bg-green-100 dark:bg-green-900/20' :
                            match.status === 'completed' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/50'
                          }`}>
                            <div>
                              <div className="font-medium">{match.player1?.name || 'TBD'}</div>
                              <div className="text-sm text-muted-foreground">{match.player1?.nickname}</div>
                            </div>
                            {match.status === 'completed' && (
                              <div className="text-lg font-bold">{match.score1}</div>
                            )}
                          </div>

                          {/* VS Divider */}
                          <div className="text-center text-sm text-muted-foreground">vs</div>

                          {/* Player 2 */}
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner_id === match.player2_id ? 'bg-green-100 dark:bg-green-900/20' :
                            match.status === 'completed' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/50'
                          }`}>
                            <div>
                              <div className="font-medium">{match.player2?.name || 'Classificado'}</div>
                              <div className="text-sm text-muted-foreground">{match.player2?.nickname}</div>
                            </div>
                            {match.status === 'completed' && (
                              <div className="text-lg font-bold">{match.score2}</div>
                            )}
                          </div>

                          {/* Match Info */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <Badge variant={getMatchStatusColor(match.status)}>
                              {match.status === 'completed' ? 'Finalizado' :
                               match.status === 'in_progress' ? 'Em Andamento' :
                               match.status === 'scheduled' ? 'Agendado' : 'Pendente'}
                            </Badge>
                            
                            {match.scheduled_date && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(match.scheduled_date).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>

                          {isAdmin && (
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Gerenciar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}