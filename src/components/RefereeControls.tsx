import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMatchControl } from '@/hooks/useMatchControl';
import { Play, Pause, StopCircle, Plus, Minus, Clock, Target, UserCheck, AlertTriangle, Trophy, Palette, XCircle } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  nickname?: string;
}

interface RefereeControlsProps {
  players: Player[];
}

export const RefereeControls: React.FC<RefereeControlsProps> = ({ players }) => {
  const {
    selectedGame,
    events,
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
    updateScore,
    updateTeamCustomization
  } = useMatchControl();

  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedAssistPlayer, setSelectedAssistPlayer] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedTeamSide, setSelectedTeamSide] = useState<'home' | 'away'>('home');
  const [eventDescription, setEventDescription] = useState('');
  const [newHomeScore, setNewHomeScore] = useState(selectedGame?.home_score || 0);
  const [newAwayScore, setNewAwayScore] = useState(selectedGame?.away_score || 0);
  const [homeTeamName, setHomeTeamName] = useState(selectedGame?.home_team_name || 'Time Casa');
  const [awayTeamName, setAwayTeamName] = useState(selectedGame?.away_team_name || 'Time Visitante');
  const [homeTeamColor, setHomeTeamColor] = useState(selectedGame?.home_team_color || '#3b82f6');
  const [awayTeamColor, setAwayTeamColor] = useState(selectedGame?.away_team_color || '#ef4444');

  if (!selectedGame || (!isReferee && !isAdmin)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {!selectedGame 
              ? 'Selecione um jogo para ver os controles de arbitragem' 
              : 'Você precisa ser designado como juiz ou ser administrador para controlar a partida'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddEvent = async () => {
    if (!selectedPlayer || !selectedEventType) return;

    await addEvent({
      player_id: selectedPlayer,
      assist_player_id: selectedEventType === 'goal' && selectedAssistPlayer ? selectedAssistPlayer : undefined,
      event_type: selectedEventType as any,
      team_side: selectedTeamSide,
      minute: Math.floor(matchTime / 60),
      description: eventDescription || undefined
    });

    // Reset form
    setSelectedPlayer('');
    setSelectedAssistPlayer('');
    setSelectedEventType('');
    setEventDescription('');
  };

  const handleUpdateScore = async () => {
    await updateScore(newHomeScore, newAwayScore);
  };

  const handleUpdateCustomization = async () => {
    await updateTeamCustomization({ homeTeamName, awayTeamName, homeTeamColor, awayTeamColor });
  };

  const eventTypeIcons = {
    goal: <Target className="w-4 h-4" />,
    assist: <UserCheck className="w-4 h-4" />,
    yellow_card: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    red_card: <AlertTriangle className="w-4 h-4 text-red-500" />,
    substitution: <UserCheck className="w-4 h-4" />,
    tackle: <Trophy className="w-4 h-4" />,
    save: <Trophy className="w-4 h-4" />,
    foul: <AlertTriangle className="w-4 h-4" />,
    offside: <AlertTriangle className="w-4 h-4" />,
    penalty_missed: <XCircle className="w-4 h-4 text-red-500" />
  };

  const eventTypeLabels = {
    goal: 'Gol',
    assist: 'Assistência',
    yellow_card: 'Cartão Amarelo',
    red_card: 'Cartão Vermelho',
    substitution: 'Substituição',
    tackle: 'Desarme',
    save: 'Defesa',
    foul: 'Falta',
    offside: 'Impedimento',
    penalty_missed: 'Pênalti Perdido'
  };

  return (
    <div className="space-y-6">
      {/* Team Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalizar Times
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="color" value={homeTeamColor} onChange={(e) => setHomeTeamColor(e.target.value)} className="h-9 w-9 rounded border cursor-pointer" />
              <Input placeholder="Nome do time da casa" value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={awayTeamColor} onChange={(e) => setAwayTeamColor(e.target.value)} className="h-9 w-9 rounded border cursor-pointer" />
              <Input placeholder="Nome do time visitante" value={awayTeamName} onChange={(e) => setAwayTeamName(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleUpdateCustomization} size="sm" variant="outline">
            Salvar nomes e cores
          </Button>
        </CardContent>
      </Card>

      {/* Match Timer and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Controle da Partida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-3xl font-bold font-mono">
                {formatTime(matchTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedGame.current_half === 1 ? '1º Tempo' : '2º Tempo'}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!selectedGame.is_match_active ? (
                <Button onClick={startMatch} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Iniciar
                </Button>
              ) : isMatchRunning ? (
                <Button onClick={pauseMatch} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pausar
                </Button>
              ) : (
                <Button onClick={resumeMatch} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Retomar
                </Button>
              )}
              
              <Button onClick={endHalf} variant="destructive" className="flex items-center gap-2">
                <StopCircle className="w-4 h-4" />
                {selectedGame.current_half === 1 ? 'Fim 1º Tempo' : 'Finalizar'}
              </Button>
            </div>
          </div>

          {/* Score Display and Update */}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {selectedGame.home_score} - {selectedGame.away_score}
              </div>
              <div className="text-sm text-muted-foreground">Placar</div>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={newHomeScore}
                onChange={(e) => setNewHomeScore(parseInt(e.target.value) || 0)}
                className="w-16 text-center"
              />
              <span>-</span>
              <Input
                type="number"
                min="0"
                value={newAwayScore}
                onChange={(e) => setNewAwayScore(parseInt(e.target.value) || 0)}
                className="w-16 text-center"
              />
              <Button onClick={handleUpdateScore} size="sm">
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Event */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar jogador" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.nickname || player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(eventTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {eventTypeIcons[type as keyof typeof eventTypeIcons]}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select value={selectedTeamSide} onValueChange={(value) => setSelectedTeamSide(value as 'home' | 'away')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">{selectedGame.home_team_name}</SelectItem>
                <SelectItem value="away">{selectedGame.away_team_name}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Descrição (opcional)"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>

          {selectedEventType === 'goal' && (
            <Select value={selectedAssistPlayer} onValueChange={setSelectedAssistPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Assistência (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {players.filter(p => p.id !== selectedPlayer).map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.nickname || player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleAddEvent}
            disabled={!selectedPlayer || !selectedEventType}
            className="w-full"
          >
            Adicionar Evento
          </Button>
        </CardContent>
      </Card>

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum evento registrado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const scorerName = event.player?.nickname || event.player?.name || 'Jogador';
                const assistName = event.assist_player?.nickname || event.assist_player?.name;
                const teamLabel = event.team_side === 'home' ? selectedGame.home_team_name : selectedGame.away_team_name;
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {eventTypeIcons[event.event_type]}
                      <div>
                        <div className="font-medium">
                          {event.event_type === 'goal'
                            ? `⚽ ${scorerName} marcou!${assistName ? ` Assistência de ${assistName}` : ''}`
                            : `${eventTypeLabels[event.event_type]} - ${scorerName}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.minute}' {teamLabel}
                          {event.description && ` - ${event.description}`}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => removeEvent(event.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};