import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlayerSelector } from "./PlayerSelector";

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  invitedPlayerIds?: string[];
}

interface GameEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onGameUpdated: (updatedGame: Game) => void;
}

export function GameEditDialog({ isOpen, onClose, game, onGameUpdated }: GameEditDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: ""
  });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (game && isOpen) {
      setFormData({
        title: game.title || "",
        date: game.date || "",
        time: game.time || "",
        location: game.location || "",
        description: game.description || ""
      });
      setSelectedPlayerIds(game.invitedPlayerIds || []);
    }
  }, [game, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date || !formData.time || !formData.location.trim()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.date < today) {
      toast({
        title: "Data inválida",
        description: "A data do jogo não pode ser no passado.",
        variant: "destructive"
      });
      return;
    }

    if (!game) return;

    const updatedGame: Game = {
      ...game,
      title: formData.title.trim(),
      date: formData.date,
      time: formData.time,
      location: formData.location.trim(),
      description: formData.description.trim() || undefined,
      invitedPlayerIds: selectedPlayerIds
    };

    onGameUpdated(updatedGame);
    onClose();

    toast({
      title: "Jogo atualizado!",
      description: `O jogo "${updatedGame.title}" foi atualizado com sucesso.`
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Jogo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título do Jogo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Pelada de Sábado"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Horário *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Local *
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Ex: Campo do Parque Central"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Informações adicionais sobre o jogo..."
              rows={3}
            />
          </div>

          <div>
            <Label>Jogadores Convidados</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Selecione os jogadores que deseja convidar para este jogo
            </div>
            <div className="border rounded-lg p-3 bg-muted/20">
              <p className="text-sm">
                ⚽ {selectedPlayerIds.length} jogadores selecionados
              </p>
              <p className="text-xs text-muted-foreground">
                Funcionalidade de seleção de jogadores em desenvolvimento
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="field-gradient">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}