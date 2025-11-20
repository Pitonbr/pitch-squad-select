import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, ArrowLeft, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTeams } from '@/hooks/useTeams';
import { MatchControlProvider, useMatchControl } from '@/hooks/useMatchControl';
import { RefereeControls } from './RefereeControls';
import { RefereeSelector } from './RefereeSelector';

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
}

interface Player {
  id: string;
  name: string;
  nickname?: string;
}

const LiveGameContent: React.FC = () => {
  const { activeTeam } = useTeams();
  const { selectedGame, setSelectedGame } = useMatchControl();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamPlayers = async () => {
    if (!activeTeam?.id) return;

    try {
      const { data } = await supabase.rpc('get_team_players', {
        _team_id: activeTeam.id
      });

      if (data) {
        setTeamPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const fetchAvailableGames = async () => {
    if (!activeTeam?.id) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', activeTeam.id)
        .eq('date', today)
        .in('status', ['scheduled', 'in_progress'])
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching games:', error);
      } else {
        setAvailableGames(data || []);
      }
    } catch (error) {
      console.error('Error fetching available games:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableGames();
    fetchTeamPlayers();
  }, [activeTeam]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando jogos...</div>
      </div>
    );
  }

  if (availableGames.length === 0) {
    return (
      <Card variant="dark" className="backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-white/70 mb-4">Nenhum jogo programado para hoje.</p>
            <p className="text-sm text-white/60">
              Jogos agendados aparecerão aqui quando estiverem próximos de começar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no game is selected, show the list of available games
  if (!selectedGame) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Jogos de Hoje</h2>
        {availableGames.map((game) => (
          <Card key={game.id} variant="dark" className="cursor-pointer hover:bg-white/5 transition-colors backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-lg text-white">{game.title}</h3>
                    <Badge variant={game.status === 'in_progress' ? 'default' : 'secondary'}>
                      {game.status === 'scheduled' ? 'Agendado' : 'Em Andamento'}
                    </Badge>
                    {game.referee_id && (
                      <Badge variant="outline" className="border-accent text-accent">
                        Juiz Designado
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-white/70">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{game.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{game.location}</span>
                    </div>
                    {game.is_match_active && (
                      <div className="font-bold text-primary">
                        {game.home_score} - {game.away_score}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => setSelectedGame(game)}
                  className="flex items-center gap-2 bg-primary hover:bg-accent text-white"
                >
                  <Play className="w-4 h-4" />
                  {game.is_match_active ? 'Continuar' : 'Gerenciar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Selected game view with full referee controls
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedGame(null)}
          className="flex items-center gap-2 border-primary/50 text-white hover:bg-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para jogos
        </Button>
        
        <Badge variant={selectedGame.status === 'in_progress' ? 'default' : 'secondary'}>
          {selectedGame.status === 'scheduled' ? 'Agendado' : 'Em Andamento'}
        </Badge>

        {selectedGame.is_match_active && (
          <Badge variant="destructive">
            AO VIVO
          </Badge>
        )}
      </div>

      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl text-white">{selectedGame.title}</CardTitle>
          <CardDescription className="flex items-center gap-4 text-white/70">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              {selectedGame.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              {selectedGame.time}
            </span>
            <span className="text-2xl font-bold text-white">
              {selectedGame.home_score} - {selectedGame.away_score}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Referee Designation (Admin only) */}
      <RefereeSelector 
        players={teamPlayers} 
        currentRefereeId={selectedGame.referee_id} 
      />

      {/* Referee Controls */}
      <RefereeControls players={teamPlayers} />
    </div>
  );
};

export const LiveGame: React.FC = () => {
  return (
    <MatchControlProvider>
      <LiveGameContent />
    </MatchControlProvider>
  );
};