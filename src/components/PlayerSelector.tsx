import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Save, Shuffle, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  profile_image?: string;
  checkedIn?: boolean;
}

interface TeamList {
  id: string;
  name: string;
  playerIds: string[];
  createdAt: Date;
}

interface PlayerSelectorProps {
  allPlayers: Player[];
  selectedPlayerIds: string[];
  onSelectionChange: (playerIds: string[]) => void;
  teamLists: TeamList[];
  onTeamListSave: (teamList: Omit<TeamList, 'id' | 'createdAt'>) => void;
  onTeamListDelete: (teamListId: string) => void;
  onTeamListLoad: (playerIds: string[]) => void;
}

export function PlayerSelector({ 
  allPlayers, 
  selectedPlayerIds, 
  onSelectionChange,
  teamLists,
  onTeamListSave,
  onTeamListDelete,
  onTeamListLoad
}: PlayerSelectorProps) {
  const { toast } = useToast();
  const [newTeamListName, setNewTeamListName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handlePlayerToggle = (playerId: string) => {
    const newSelection = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter(id => id !== playerId)
      : [...selectedPlayerIds, playerId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(allPlayers.map(p => p.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const handleRandomSelection = (count: number) => {
    const shuffled = [...allPlayers].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map(p => p.id);
    onSelectionChange(selected);
  };

  const handleSaveTeamList = () => {
    if (!newTeamListName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a lista de equipe.",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlayerIds.length === 0) {
      toast({
        title: "Nenhum jogador selecionado",
        description: "Selecione pelo menos um jogador para salvar a lista.",
        variant: "destructive"
      });
      return;
    }

    onTeamListSave({
      name: newTeamListName,
      playerIds: selectedPlayerIds
    });

    setNewTeamListName("");
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Lista salva!",
      description: `Lista "${newTeamListName}" criada com ${selectedPlayerIds.length} jogadores.`,
    });
  };

  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Selecionar Jogadores</span>
          </div>
          <Badge variant="outline">
            {selectedPlayerIds.length} selecionados
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Seleção Individual</TabsTrigger>
            <TabsTrigger value="teams">Listas Salvas</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Buscar jogadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Todos
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Limpar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRandomSelection(22)}
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  22 Aleatórios
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePlayerToggle(player.id)}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player.id)}
                    onChange={() => handlePlayerToggle(player.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.nickname} • {player.position}</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPlayerIds.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedPlayerIds.length} jogadores selecionados
                </span>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Lista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar Lista de Equipe</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="teamName">Nome da Lista</Label>
                        <Input
                          id="teamName"
                          value={newTeamListName}
                          onChange={(e) => setNewTeamListName(e.target.value)}
                          placeholder="Ex: Equipe Titular, Time dos Veteranos..."
                        />
                      </div>
                      <Button onClick={handleSaveTeamList} className="w-full">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Lista
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4 mt-4">
            {teamLists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma lista salva ainda.</p>
                <p className="text-sm">Crie uma lista na aba "Seleção Individual".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamLists.map((teamList) => (
                  <Card key={teamList.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{teamList.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {teamList.playerIds.length} jogadores
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTeamListLoad(teamList.playerIds)}
                        >
                          Carregar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTeamListDelete(teamList.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}