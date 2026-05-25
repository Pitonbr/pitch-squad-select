import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getInitialsAvatar } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, UserMinus } from "lucide-react";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email?: string;
  profile_image?: string;
  checkedIn?: boolean;
}

interface GamePlayerManagerProps {
  gameId: string;
  allPlayers: Player[];
  invitedPlayers: Player[];
  onPlayersUpdate: (updatedPlayers: Player[]) => void;
}

export function GamePlayerManager({ 
  gameId, 
  allPlayers, 
  invitedPlayers, 
  onPlayersUpdate 
}: GamePlayerManagerProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    invitedPlayers.map(p => p.id)
  );

  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayerToggle = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayerIds(prev => [...prev, playerId]);
    } else {
      setSelectedPlayerIds(prev => prev.filter(id => id !== playerId));
    }
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === allPlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(allPlayers.map(p => p.id));
    }
  };

  const handleSaveChanges = () => {
    const updatedInvitedPlayers = allPlayers.filter(player => 
      selectedPlayerIds.includes(player.id)
    );
    
    onPlayersUpdate(updatedInvitedPlayers);
    
    toast({
      title: "Jogadores atualizados!",
      description: `${updatedInvitedPlayers.length} jogadores foram convidados para o jogo.`,
    });
  };

  const addedCount = selectedPlayerIds.filter(id => 
    !invitedPlayers.some(p => p.id === id)
  ).length;

  const removedCount = invitedPlayers.filter(p => 
    !selectedPlayerIds.includes(p.id)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Gerenciar Jogadores do Jogo</span>
          </div>
          <Badge variant="outline">
            {selectedPlayerIds.length} selecionados
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar jogadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSelectAll}
            className="whitespace-nowrap"
          >
            {selectedPlayerIds.length === allPlayers.length ? "Desmarcar Todos" : "Selecionar Todos"}
          </Button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredPlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const wasInvited = invitedPlayers.some(p => p.id === player.id);
            
            return (
              <div
                key={player.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  isSelected ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handlePlayerToggle(player.id, checked as boolean)}
                />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player.profile_image || getInitialsAvatar(player.name)} />
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm truncate">{player.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {player.position}
                    </Badge>
                    {!wasInvited && isSelected && (
                      <Badge className="text-xs bg-green-100 text-green-800">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Novo
                      </Badge>
                    )}
                    {wasInvited && !isSelected && (
                      <Badge className="text-xs bg-red-100 text-red-800">
                        <UserMinus className="h-3 w-3 mr-1" />
                        Removido
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {player.nickname} • {player.phone}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {(addedCount > 0 || removedCount > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              {addedCount > 0 && (
                <span className="text-green-600">
                  +{addedCount} jogador{addedCount > 1 ? 'es' : ''} adicionado{addedCount > 1 ? 's' : ''}
                </span>
              )}
              {removedCount > 0 && (
                <span className="text-red-600">
                  -{removedCount} jogador{removedCount > 1 ? 'es' : ''} removido{removedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Button 
              onClick={handleSaveChanges}
              className="w-full field-gradient font-semibold"
            >
              Salvar Alterações
            </Button>
          </div>
        )}

        {addedCount === 0 && removedCount === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Faça alterações na seleção para salvar
          </p>
        )}
      </CardContent>
    </Card>
  );
}