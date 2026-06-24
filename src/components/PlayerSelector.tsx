import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitialsAvatar } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Save, Shuffle, Trash2, Scale } from "lucide-react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { splitTeamsBalanced, randomBalancedSelection, type BalanceCriterion } from "@/lib/teamBalancer";
import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  profile_image?: string;
  skill_level?: number;
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
    const selected = randomBalancedSelection(allPlayers, count);
    onSelectionChange(selected);
  };

  const [balancedPreview, setBalancedPreview] = useState<ReturnType<typeof splitTeamsBalanced> | null>(null);
  const [balanceCriteria, setBalanceCriteria] = useState<BalanceCriterion[]>(["skill_level"]);
  const [goalkeeperAssignments, setGoalkeeperAssignments] = useState<Record<string, "teamA" | "teamB">>({});
  const [sorting, setSorting] = useState(false);

  const toggleCriterion = (criterion: BalanceCriterion) => {
    setBalanceCriteria(prev =>
      prev.includes(criterion) ? prev.filter(c => c !== criterion) : [...prev, criterion]
    );
  };

  const selectedGoalkeepers = allPlayers.filter(
    p => selectedPlayerIds.includes(p.id) && p.position === "Goleiro"
  );

  const handleBalancedSort = async () => {
    const selected = allPlayers.filter(p => selectedPlayerIds.includes(p.id));
    if (selected.length < 2) {
      toast({ title: "Selecione ao menos 2 jogadores", variant: "destructive" });
      return;
    }

    let withRatings = selected;
    if (balanceCriteria.includes("avg_rating")) {
      setSorting(true);
      const { data } = await supabase
        .from("player_statistics")
        .select("player_id, avg_rating")
        .in("player_id", selected.map(p => p.id));
      const ratingById = new Map((data || []).map(r => [r.player_id, r.avg_rating]));
      withRatings = selected.map(p => ({ ...p, avg_rating: ratingById.get(p.id) ?? undefined }));
      setSorting(false);
    }

    setBalancedPreview(
      splitTeamsBalanced(withRatings, { criteria: balanceCriteria, fixedGoalkeepers: goalkeeperAssignments })
    );
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
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  Todos
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
                  Limpar
                </Button>
                <Button
                  type="button"
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
                  onClick={(e) => {
                    // Radix Checkbox dispara um clique sintético num input oculto
                    // ao mudar de estado, que sobe (bubble) até aqui — ignorá-lo
                    // evita um loop infinito de toggle (clique real vs. sintético).
                    if (e.target instanceof HTMLInputElement) return;
                    handlePlayerToggle(player.id);
                  }}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player.id)}
                    onCheckedChange={() => handlePlayerToggle(player.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.profile_image || getInitialsAvatar(player.name)} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.nickname} • {player.position}</div>
                  </div>
                  {player.skill_level && (
                    <div className="flex gap-px shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= player.skill_level! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedPlayerIds.length >= 2 && (
              <div className="pt-2 border-t space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Critérios do sorteio (combináveis)</Label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["skill_level", "Nível de habilidade"],
                      ["avg_rating", "Avaliação média"],
                      ["position", "Posição"],
                    ] as const).map(([criterion, label]) => (
                      <Badge
                        key={criterion}
                        variant={balanceCriteria.includes(criterion) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCriterion(criterion)}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedGoalkeepers.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Goleiro fixo (opcional)</Label>
                    {selectedGoalkeepers.map(gk => (
                      <div key={gk.id} className="flex items-center justify-between text-sm gap-2">
                        <span className="truncate">{gk.nickname || gk.name}</span>
                        <div className="flex gap-1 shrink-0">
                          {([
                            [undefined, "Sortear"],
                            ["teamA", "Time A"],
                            ["teamB", "Time B"],
                          ] as const).map(([value, label]) => (
                            <Badge
                              key={label}
                              variant={
                                (goalkeeperAssignments[gk.id] ?? undefined) === value ? "default" : "outline"
                              }
                              className="cursor-pointer text-xs"
                              onClick={() =>
                                setGoalkeeperAssignments(prev => {
                                  const next = { ...prev };
                                  if (value) next[gk.id] = value;
                                  else delete next[gk.id];
                                  return next;
                                })
                              }
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-primary/50 text-primary hover:bg-primary/10"
                  onClick={handleBalancedSort}
                  disabled={sorting}
                >
                  <Scale className="h-4 w-4" />
                  Sortear Times Equilibrados
                </Button>

                {balancedPreview && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['teamA', 'teamB'] as const).map((side, i) => {
                      const team = balancedPreview[side];
                      const skill = side === 'teamA' ? balancedPreview.skillA : balancedPreview.skillB;
                      return (
                        <div key={side} className={`p-2 rounded-md border ${i === 0 ? 'border-blue-500/40 bg-blue-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                          <div className={`font-semibold mb-1 ${i === 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            Time {i === 0 ? 'A' : 'B'} — ⭐ {skill}
                          </div>
                          {team.map(p => (
                            <div key={p.id} className="truncate text-muted-foreground">{p.nickname || p.name}</div>
                          ))}
                        </div>
                      );
                    })}
                    <div className="col-span-2 text-center text-muted-foreground">
                      Diferença de habilidade: {balancedPreview.diff} ponto{balancedPreview.diff !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedPlayerIds.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {selectedPlayerIds.length} jogadores selecionados
                </span>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
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
                      <Button type="button" onClick={handleSaveTeamList} className="w-full">
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
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onTeamListLoad(teamList.playerIds)}
                        >
                          Carregar
                        </Button>
                        <Button
                          type="button"
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