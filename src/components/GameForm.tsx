import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlayerSelector } from "./PlayerSelector";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  checkedIn?: boolean;
}

interface TeamList {
  id: string;
  name: string;
  playerIds: string[];
  createdAt: Date;
}

interface GameFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  invitedPlayerIds: string[];
}

interface GameFormProps {
  allPlayers: Player[];
  teamLists: TeamList[];
  onGameCreated: (game: GameFormData) => void;
  onTeamListSave: (teamList: Omit<TeamList, 'id' | 'createdAt'>) => void;
  onTeamListDelete: (teamListId: string) => void;
}

export function GameForm({ 
  allPlayers, 
  teamLists, 
  onGameCreated, 
  onTeamListSave, 
  onTeamListDelete 
}: GameFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<GameFormData>({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    invitedPlayerIds: []
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      toast({
        title: "Erro na criação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se a data é no futuro
    const gameDate = new Date(`${formData.date}T${formData.time}`);
    if (gameDate <= new Date()) {
      toast({
        title: "Data inválida",
        description: "A data do jogo deve ser no futuro.",
        variant: "destructive"
      });
      return;
    }

    const gameData = {
      ...formData,
      invitedPlayerIds: selectedPlayerIds
    };
    
    onGameCreated(gameData);
    
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      invitedPlayerIds: []
    });
    setSelectedPlayerIds([]);

    toast({
      title: "Jogo criado!",
      description: `${formData.title} foi adicionado ao calendário.`,
    });
  };

  // Gerar data mínima (hoje)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5 text-primary" />
          <span>Criar Novo Jogo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Jogo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Pelada da Galera - Sábado"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Data *</span>
              </Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Horário *</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Local *</span>
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Campo Central - Rua das Flores, 123"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações adicionais sobre o jogo..."
              className="w-full"
              rows={3}
            />
          </div>

          <PlayerSelector
            allPlayers={allPlayers}
            selectedPlayerIds={selectedPlayerIds}
            onSelectionChange={setSelectedPlayerIds}
            teamLists={teamLists}
            onTeamListSave={onTeamListSave}
            onTeamListDelete={onTeamListDelete}
            onTeamListLoad={setSelectedPlayerIds}
          />

          <Button type="submit" className="w-full field-gradient font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Criar Jogo {selectedPlayerIds.length > 0 && `(${selectedPlayerIds.length} jogadores)`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}