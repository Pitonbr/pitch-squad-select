import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Phone, User, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerFormData {
  name: string;
  nickname: string;
  position: string;
  phone: string;
}

interface PlayerFormProps {
  onPlayerAdded: (player: PlayerFormData) => void;
}

const positions = [
  "Goleiro",
  "Zagueiro", 
  "Lateral",
  "Volante",
  "Meia",
  "Atacante"
];

export function PlayerForm({ onPlayerAdded }: PlayerFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PlayerFormData>({
    name: "",
    nickname: "",
    position: "",
    phone: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nickname || !formData.position || !formData.phone) {
      toast({
        title: "Erro no cadastro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    onPlayerAdded(formData);
    
    setFormData({
      name: "",
      nickname: "", 
      position: "",
      phone: ""
    });

    toast({
      title: "Jogador cadastrado!",
      description: `${formData.name} foi adicionado à lista de jogadores.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <span>Cadastrar Novo Jogador</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Nome Completo *</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido/Nome de Guerra *</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ex: Joãozinho"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Posição *</span>
              </Label>
              <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma posição" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>Celular *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full"
              />
            </div>
          </div>

          <Button type="submit" className="w-full field-gradient font-semibold">
            <UserPlus className="h-4 w-4 mr-2" />
            Cadastrar Jogador
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}