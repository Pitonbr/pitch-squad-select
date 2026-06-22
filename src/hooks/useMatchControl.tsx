import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTeams } from './useTeams';
import { toast } from 'sonner';

interface MatchEvent {
  id: string;
  game_id: string;
  player_id?: string;
  assist_player_id?: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'tackle' | 'save' | 'foul' | 'offside';
  minute: number;
  description?: string;
  team_side?: 'home' | 'away';
  created_at: string;
  player?: {
    name: string;
    nickname?: string;
  };
  assist_player?: {
    name: string;
    nickname?: string;
  };
}

interface MatchLineup {
  id: string;
  game_id: string;
  team_side: 'home' | 'away';
  player_id: string;
  position: string;
  is_starter: boolean;
  substituted_at?: number;
  substituted_by?: string;
  player: {
    name: string;
    nickname?: string;
  };
}

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  team_id: string;
  referee_id?: string;
  match_time_started?: string;
  match_time_paused?: string;
  current_half: number;
  home_score: number;
  away_score: number;
  match_duration_minutes: number;
  is_match_active: boolean;
  home_team_name: string;
  away_team_name: string;
  home_team_color: string;
  away_team_color: string;
}

interface MatchControlContextType {
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  events: MatchEvent[];
  lineups: MatchLineup[];
  isReferee: boolean;
  isAdmin: boolean;
  matchTime: number;
  isMatchRunning: boolean;
  startMatch: () => Promise<void>;
  pauseMatch: () => Promise<void>;
  resumeMatch: () => Promise<void>;
  endHalf: () => Promise<void>;
  addEvent: (event: Omit<MatchEvent, 'id' | 'game_id' | 'created_at'>) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  designateReferee: (playerId: string) => Promise<void>;
  updateScore: (homeScore: number, awayScore: number) => Promise<void>;
  updateTeamCustomization: (data: { homeTeamName: string; awayTeamName: string; homeTeamColor: string; awayTeamColor: string }) => Promise<void>;
  loading: boolean;
  refreshMatchData: () => Promise<void>;
}

const MatchControlContext = createContext<MatchControlContextType | undefined>(undefined);

export const MatchControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeTeam, isTeamAdmin } = useTeams();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [matchTime, setMatchTime] = useState(0);
  const [isMatchRunning, setIsMatchRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = isTeamAdmin(activeTeam?.id || '');
  const [isReferee, setIsReferee] = useState(false);

  // Check if current user is the referee
  useEffect(() => {
    const checkRefereeStatus = async () => {
      if (!selectedGame?.referee_id || !user) return;

      const { data: player } = await supabase
        .from('players')
        .select('profile_id')
        .eq('id', selectedGame.referee_id)
        .single();

      if (player) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', player.profile_id)
          .single();

        setIsReferee(profile?.user_id === user.id);
      }
    };

    checkRefereeStatus();
  }, [selectedGame?.referee_id, user]);

  // Match timer effect
  useEffect(() => {
    if (!isMatchRunning || !selectedGame?.is_match_active) return;

    const interval = setInterval(() => {
      setMatchTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMatchRunning, selectedGame?.is_match_active]);

  // Load match data when game changes
  useEffect(() => {
    if (selectedGame) {
      refreshMatchData();
    }
  }, [selectedGame]);

  const refreshMatchData = async () => {
    if (!selectedGame) return;

    setLoading(true);
    try {
      // Load events
      const { data: eventsData } = await supabase
        .from('match_events')
        .select('*')
        .eq('game_id', selectedGame.id)
        .order('minute', { ascending: true });

      if (eventsData) {
        // Load player details separately to avoid relationship issues
        const eventsWithPlayers = await Promise.all(
          eventsData.map(async (event) => {
            let enriched: any = event;
            if (event.player_id) {
              const { data: player } = await supabase
                .from('players')
                .select('name, nickname')
                .eq('id', event.player_id)
                .single();
              enriched = { ...enriched, player };
            }
            if (event.assist_player_id) {
              const { data: assistPlayer } = await supabase
                .from('players')
                .select('name, nickname')
                .eq('id', event.assist_player_id)
                .single();
              enriched = { ...enriched, assist_player: assistPlayer };
            }
            return enriched;
          })
        );
        setEvents(eventsWithPlayers as MatchEvent[]);
      }

      // Load lineups
      const { data: lineupsData } = await supabase
        .from('match_lineups')
        .select('*')
        .eq('game_id', selectedGame.id);

      if (lineupsData) {
        // Load player details separately
        const lineupsWithPlayers = await Promise.all(
          lineupsData.map(async (lineup) => {
            const { data: player } = await supabase
              .from('players')
              .select('name, nickname')
              .eq('id', lineup.player_id)
              .single();
            
            return { ...lineup, player };
          })
        );
        setLineups(lineupsWithPlayers as MatchLineup[]);
      }

      // Update match time based on database
      if (selectedGame.is_match_active && selectedGame.match_time_started) {
        const startTime = new Date(selectedGame.match_time_started).getTime();
        const pauseTime = selectedGame.match_time_paused ? new Date(selectedGame.match_time_paused).getTime() : Date.now();
        const elapsedSeconds = Math.floor((pauseTime - startTime) / 1000) + (selectedGame.match_duration_minutes * 60);
        setMatchTime(elapsedSeconds);
        setIsMatchRunning(!selectedGame.match_time_paused);
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async () => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          match_time_started: new Date().toISOString(),
          is_match_active: true,
          match_time_paused: null,
          status: 'in_progress'
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setIsMatchRunning(true);
      toast.success('Partida iniciada!');
      refreshMatchData();
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Erro ao iniciar partida');
    }
  };

  const pauseMatch = async () => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          match_time_paused: new Date().toISOString(),
          match_duration_minutes: Math.floor(matchTime / 60)
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setIsMatchRunning(false);
      toast.success('Partida pausada');
    } catch (error) {
      console.error('Error pausing match:', error);
      toast.error('Erro ao pausar partida');
    }
  };

  const resumeMatch = async () => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          match_time_started: new Date().toISOString(),
          match_time_paused: null
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setIsMatchRunning(true);
      toast.success('Partida retomada!');
    } catch (error) {
      console.error('Error resuming match:', error);
      toast.error('Erro ao retomar partida');
    }
  };

  const endHalf = async () => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const newHalf = selectedGame.current_half === 1 ? 2 : 1;
      const isGameEnded = selectedGame.current_half === 2;

      const { error } = await supabase
        .from('games')
        .update({
          current_half: newHalf,
          match_time_paused: new Date().toISOString(),
          is_match_active: !isGameEnded,
          status: isGameEnded ? 'finished' : 'in_progress',
          finished_at: isGameEnded ? new Date().toISOString() : null,
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      setIsMatchRunning(false);
      toast.success(isGameEnded ? 'Partida finalizada!' : 'Fim do primeiro tempo');
      
      // Create notification when game ends
      if (isGameEnded && activeTeam) {
        await createGameFinishedNotification();
      }
      
      refreshMatchData();
    } catch (error) {
      console.error('Error ending half:', error);
      toast.error('Erro ao finalizar tempo');
    }
  };

  const createGameFinishedNotification = async () => {
    if (!selectedGame || !activeTeam) return;

    try {
      // Get top scorer from events
      const { data: topScorerData } = await supabase
        .from('match_events')
        .select(`
          player_id,
          player:players(name)
        `)
        .eq('game_id', selectedGame.id)
        .eq('event_type', 'goal')
        .limit(1);

      const topScorer = topScorerData?.[0]?.player as any;
      
      const finalScore = `${selectedGame.home_score || 0} x ${selectedGame.away_score || 0}`;
      
      // Create notification
      await supabase
        .from('game_notifications')
        .insert({
          game_id: selectedGame.id,
          team_id: activeTeam.id,
          title: `Jogo Finalizado: ${selectedGame.title}`,
          message: `O jogo "${selectedGame.title}" terminou com o placar ${finalScore}.\n\nParabéns a todos os participantes!`,
          notification_type: 'game_finished',
          metadata: {
            finalScore,
            topScorer: topScorer?.name || null,
            homeScore: selectedGame.home_score || 0,
            awayScore: selectedGame.away_score || 0
          }
        });

      console.log('Game finished notification created');
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const addEvent = async (event: Omit<MatchEvent, 'id' | 'game_id' | 'created_at'>) => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('match_events')
        .insert({
          game_id: selectedGame.id,
          ...event
        });

      if (error) throw error;

      toast.success('Evento adicionado!');
      refreshMatchData();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Erro ao adicionar evento');
    }
  };

  const removeEvent = async (eventId: string) => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('match_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento removido!');
      refreshMatchData();
    } catch (error) {
      console.error('Error removing event:', error);
      toast.error('Erro ao remover evento');
    }
  };

  const designateReferee = async (playerId: string) => {
    if (!selectedGame || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ referee_id: playerId })
        .eq('id', selectedGame.id);

      if (error) throw error;

      toast.success('Juiz designado com sucesso!');
      refreshMatchData();
    } catch (error) {
      console.error('Error designating referee:', error);
      toast.error('Erro ao designar juiz');
    }
  };

  const updateScore = async (homeScore: number, awayScore: number) => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          home_score: homeScore, 
          away_score: awayScore 
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      toast.success('Placar atualizado!');
      refreshMatchData();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Erro ao atualizar placar');
    }
  };

  const updateTeamCustomization = async (data: { homeTeamName: string; awayTeamName: string; homeTeamColor: string; awayTeamColor: string }) => {
    if (!selectedGame || (!isReferee && !isAdmin)) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          home_team_name: data.homeTeamName,
          away_team_name: data.awayTeamName,
          home_team_color: data.homeTeamColor,
          away_team_color: data.awayTeamColor,
        })
        .eq('id', selectedGame.id);

      if (error) throw error;

      toast.success('Times personalizados!');
      setSelectedGame(prev => prev ? {
        ...prev,
        home_team_name: data.homeTeamName,
        away_team_name: data.awayTeamName,
        home_team_color: data.homeTeamColor,
        away_team_color: data.awayTeamColor,
      } : prev);
    } catch (error) {
      console.error('Error customizing teams:', error);
      toast.error('Erro ao personalizar times');
    }
  };

  return (
    <MatchControlContext.Provider value={{
      selectedGame,
      setSelectedGame,
      events,
      lineups,
      isReferee,
      isAdmin,
      matchTime,
      isMatchRunning,
      startMatch,
      pauseMatch,
      resumeMatch,
      endHalf,
      addEvent,
      removeEvent,
      designateReferee,
      updateScore,
      updateTeamCustomization,
      loading,
      refreshMatchData
    }}>
      {children}
    </MatchControlContext.Provider>
  );
};

export const useMatchControl = () => {
  const context = useContext(MatchControlContext);
  if (context === undefined) {
    throw new Error('useMatchControl must be used within a MatchControlProvider');
  }
  return context;
};