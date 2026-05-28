import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Plus, AlarmClock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlayerSelector } from "./PlayerSelector";
import { gameFormSchema, formatZodError } from "@/lib/validation";

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

interface GameFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  invitedPlayerIds: string[];
  checkinDeadlineMinutes: number;
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
    invitedPlayerIds: [],
    checkinDeadlineMinutes: 30
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with zod
    const validation = gameFormSchema.safeParse({
      title: formData.title,
      location: formData.location,
      description: formData.description || "",
      date: formData.date,
      time: formData.time,
    });

    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: formatZodError(validation.error),
        variant: "destructive",
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
      invitedPlayerIds: [],
      checkinDeadlineMinutes: 30
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
    <Card variant="dark" className="backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Plus className="h-5 w-5 text-primary" />
          <span>Criar Novo Jogo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Nome do Jogo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Pelada da Galera - Sábado"
              className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-1 text-white">
                <Calendar className="h-3 w-3 text-primary" />
                <span>Data *</span>
              </Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center space-x-1 text-white">
                <Clock className="h-3 w-3 text-primary" />
                <span>Horário *</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-1 text-white">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Local *</span>
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Campo Central - Rua das Flores, 123"
              className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Observações</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informações adicionais sobre o jogo..."
              className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkinDeadline" className="flex items-center space-x-1 text-white">
              <AlarmClock className="h-3 w-3 text-primary" />
              <span>Prazo para Check-in *</span>
            </Label>
            <Select
              value={formData.checkinDeadlineMinutes.toString()}
              onValueChange={(value) => setFormData({ ...formData, checkinDeadlineMinutes: parseInt(value) })}
            >
              <SelectTrigger className="w-full bg-background/50 border-primary/30 text-white">
                <SelectValue placeholder="Selecione o prazo" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 59 }, (_, i) => i + 1).map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()}>
                    {minutes} minuto{minutes > 1 ? 's' : ''} antes do jogo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">
              Após este prazo, o check-in será fechado e apenas jogadores confirmados poderão participar da seleção de times.
            </p>
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