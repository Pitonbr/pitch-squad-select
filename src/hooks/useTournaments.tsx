import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTeams } from './useTeams';
import { useToast } from './use-toast';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  team_id: string;
  tournament_type: 'single_elimination' | 'round_robin';
  status: 'setup' | 'active' | 'completed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id: string;
  player2_id?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score1: number;
  score2: number;
  winner_id?: string;
  is_return_leg: boolean;
  created_at: string;
  updated_at: string;
}

export function useTournaments() {
  const { user } = useAuth();
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTeam?.id) {
      fetchTournaments();
    }
  }, [activeTeam?.id]);

  const fetchTournaments = async () => {
    if (!activeTeam?.id) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('team_id', activeTeam.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments((data || []) as Tournament[]);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Erro ao buscar campeonatos",
        description: "Não foi possível carregar os campeonatos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (tournamentData: {
    name: string;
    description?: string;
    tournament_type: 'single_elimination' | 'round_robin';
    player_ids: string[];
  }) => {
    if (!user?.id || !activeTeam?.id) return null;

    try {
      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: tournamentData.name,
          description: tournamentData.description,
          team_id: activeTeam.id,
          tournament_type: tournamentData.tournament_type,
          created_by: user.id,
        })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Add participants
      const participants = tournamentData.player_ids.map(player_id => ({
        tournament_id: tournament.id,
        player_id
      }));

      const { error: participantsError } = await supabase
        .from('tournament_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Generate matches
      await generateMatches(tournament.id, tournamentData.player_ids, tournamentData.tournament_type);

      toast({
        title: "Campeonato criado!",
        description: `${tournament.name} foi criado com sucesso.`,
      });

      fetchTournaments();
      return tournament;
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Erro ao criar campeonato",
        description: "Não foi possível criar o campeonato.",
        variant: "destructive"
      });
      return null;
    }
  };

  const generateMatches = async (
    tournamentId: string, 
    playerIds: string[], 
    tournamentType: 'single_elimination' | 'round_robin'
  ) => {
    if (tournamentType === 'single_elimination') {
      return generateSingleEliminationMatches(tournamentId, playerIds);
    } else {
      return generateRoundRobinMatches(tournamentId, playerIds);
    }
  };

  const generateSingleEliminationMatches = async (tournamentId: string, playerIds: string[]) => {
    // Shuffle players for random draw
    const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);
    
    // Ensure power of 2 bracket (fill with byes if needed)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(shuffledPlayers.length)));
    while (shuffledPlayers.length < nextPowerOf2) {
      shuffledPlayers.push(''); // Empty slot for bye
    }

    const matches = [];
    let round = 1;
    let matchNumber = 1;

    // First round
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      const player1 = shuffledPlayers[i];
      const player2 = shuffledPlayers[i + 1];

      matches.push({
        tournament_id: tournamentId,
        round,
        match_number: matchNumber++,
        player1_id: player1,
        player2_id: player2 || null,
        status: 'scheduled' as const,
        score1: 0,
        score2: 0,
        is_return_leg: false
      });
    }

    const { error } = await supabase
      .from('tournament_matches')
      .insert(matches);

    if (error) throw error;
  };

  const generateRoundRobinMatches = async (tournamentId: string, playerIds: string[]) => {
    const matches = [];
    let matchNumber = 1;

    // Generate all possible pairings
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        // Home match
        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: matchNumber++,
          player1_id: playerIds[i],
          player2_id: playerIds[j],
          status: 'scheduled' as const,
          score1: 0,
          score2: 0,
          is_return_leg: false
        });

        // Away match (return leg)
        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: matchNumber++,
          player1_id: playerIds[j],
          player2_id: playerIds[i],
          status: 'scheduled' as const,
          score1: 0,
          score2: 0,
          is_return_leg: true
        });
      }
    }

    const { error } = await supabase
      .from('tournament_matches')
      .insert(matches);

    if (error) throw error;
  };

  const updateMatchResult = async (
    matchId: string,
    score1: number,
    score2: number
  ) => {
    try {
      const winnerId = score1 > score2 ? 'player1' : score1 < score2 ? 'player2' : null;
      
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          score1,
          score2,
          winner_id: winnerId,
          status: 'completed'
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Resultado atualizado!",
        description: "O placar foi registrado com sucesso.",
      });

      // Check if we need to generate next round matches
      await checkAndGenerateNextRound(matchId);
      
    } catch (error) {
      console.error('Error updating match result:', error);
      toast({
        title: "Erro ao atualizar resultado",
        description: "Não foi possível registrar o placar.",
        variant: "destructive"
      });
    }
  };

  const checkAndGenerateNextRound = async (completedMatchId: string) => {
    // Implementation for generating next round matches in elimination tournaments
    // This would check if all matches in current round are complete
    // and generate the next round with winners
  };

  const scheduleMatch = async (
    matchId: string,
    date: string,
    time: string,
    location: string
  ) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          scheduled_date: date,
          scheduled_time: time,
          location
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Jogo agendado!",
        description: "O jogo foi agendado com sucesso.",
      });

    } catch (error) {
      console.error('Error scheduling match:', error);
      toast({
        title: "Erro ao agendar jogo",
        description: "Não foi possível agendar o jogo.",
        variant: "destructive"
      });
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) throw error;

      toast({
        title: "Campeonato excluído",
        description: "O campeonato foi removido com sucesso.",
      });

      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Erro ao excluir campeonato",
        description: "Não foi possível remover o campeonato.",
        variant: "destructive"
      });
    }
  };

  return {
    tournaments,
    loading,
    createTournament,
    updateMatchResult,
    scheduleMatch,
    deleteTournament,
    refreshTournaments: fetchTournaments
  };
}