import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Phone, User, MapPin, Mail, Hash, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlayerFormData {
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email: string;
  jersey_number: number | string;
  profile_image?: string;
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
    phone: "",
    email: "",
    jersey_number: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('player-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nickname || !formData.position || !formData.phone || !formData.email) {
      toast({
        title: "Erro no cadastro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    let profileImageUrl = formData.profile_image;
    if (imageFile) {
      profileImageUrl = await handleImageUpload(imageFile);
      if (!profileImageUrl) return;
    }

    try {
      // Get current user's profile  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Erro",
          description: "Profile do usuário não encontrado",
          variant: "destructive",
        });
        return;
      }

      // Get current active team
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('profile_id', profile.id);

      if (!teamMemberships || teamMemberships.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum time encontrado para este usuário",
          variant: "destructive",
        });
        return;
      }

      const activeTeamId = teamMemberships[0].team_id; // Use first team for now

      // Save player to database
      const { data: newPlayer, error } = await supabase
        .from('players')
        .insert({
          team_id: activeTeamId,
          profile_id: profile.id,
          name: formData.name,
          nickname: formData.nickname,
          position: formData.position,
          phone: formData.phone,
          email: formData.email,
          jersey_number: formData.jersey_number ? Number(formData.jersey_number) : undefined,
          profile_image: profileImageUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving player:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar jogador no banco de dados",
          variant: "destructive",
        });
        return;
      }

      // Call callback with saved player data
      onPlayerAdded(newPlayer);
      
      // Reset form
      setFormData({
        name: "",
        nickname: "", 
        position: "",
        phone: "",
        email: "",
        jersey_number: ""
      });
      setImageFile(null);

      toast({
        title: "Jogador cadastrado!",
        description: `${formData.name} foi adicionado à lista de jogadores.`,
      });

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao adicionar jogador",
        variant: "destructive",
      });
    }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>Email *</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jogador@email.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jersey" className="flex items-center space-x-1">
                <Hash className="h-3 w-3" />
                <span>Número da Camisa</span>
              </Label>
              <Input
                id="jersey"
                type="number"
                value={formData.jersey_number}
                onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                placeholder="10"
                min="1"
                max="99"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center space-x-1">
              <Upload className="h-3 w-3" />
              <span>Foto do Jogador</span>
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full"
            />
            {imageFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {imageFile.name}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full field-gradient font-semibold" disabled={uploading}>
            <UserPlus className="h-4 w-4 mr-2" />
            {uploading ? "Fazendo upload..." : "Cadastrar Jogador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}