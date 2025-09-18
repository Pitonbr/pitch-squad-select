import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMatchControl } from '@/hooks/useMatchControl';
import { UserCheck, Gavel } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  nickname?: string;
}

interface RefereeSelectorProps {
  players: Player[];
  currentRefereeId?: string;
}

export const RefereeSelector: React.FC<RefereeSelectorProps> = ({ players, currentRefereeId }) => {
  const { designateReferee, isAdmin } = useMatchControl();
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  if (!isAdmin) {
    return null;
  }

  const currentReferee = players.find(p => p.id === currentRefereeId);

  const handleDesignateReferee = async () => {
    if (selectedPlayerId) {
      await designateReferee(selectedPlayerId);
      setSelectedPlayerId('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="w-5 h-5" />
          Designar Juiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentReferee && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Juiz atual: {currentReferee.nickname || currentReferee.name}
            </Badge>
          </div>
        )}

        <div className="flex gap-2">
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar novo juiz" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem 
                  key={player.id} 
                  value={player.id}
                  disabled={player.id === currentRefereeId}
                >
                  {player.nickname || player.name}
                  {player.id === currentRefereeId && ' (Atual)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleDesignateReferee}
            disabled={!selectedPlayerId || selectedPlayerId === currentRefereeId}
          >
            Designar
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          O juiz terá controle total sobre a partida, podendo gerenciar o tempo, placar e eventos do jogo.
        </p>
      </CardContent>
    </Card>
  );
};