import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Phone, User, MapPin, Mail, Hash, Upload, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { playerFormSchema, formatZodError } from "@/lib/validation";

interface PlayerFormData {
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email: string;
  jersey_number: number | string;
  skill_level: number;
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
    jersey_number: "",
    skill_level: 3,
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
    
    // Validate form data with zod
    const validation = playerFormSchema.safeParse({
      name: formData.name,
      nickname: formData.nickname,
      position: formData.position,
      phone: formData.phone,
      email: formData.email || "",
      jersey_number: formData.jersey_number ? parseInt(formData.jersey_number as string) : undefined,
    });

    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: formatZodError(validation.error),
        variant: "destructive",
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
          skill_level: formData.skill_level,
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
        jersey_number: "",
        skill_level: 3,
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
    <Card variant="dark" className="backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <UserPlus className="h-5 w-5 text-primary" />
          <span>Cadastrar Novo Jogador</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-1 text-white">
                <User className="h-3 w-3 text-primary" />
                <span>Nome Completo *</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-white">Apelido/Nome de Guerra *</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ex: Joãozinho"
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-1 text-white">
                <MapPin className="h-3 w-3 text-primary" />
                <span>Posição *</span>
              </Label>
              <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                <SelectTrigger className="bg-background/50 border-primary/30 text-white">
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
              <Label htmlFor="phone" className="flex items-center space-x-1 text-white">
                <Phone className="h-3 w-3 text-primary" />
                <span>Celular *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-1 text-white">
                <Mail className="h-3 w-3 text-primary" />
                <span>Email *</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jogador@email.com"
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jersey" className="flex items-center space-x-1 text-white">
                <Hash className="h-3 w-3 text-primary" />
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
                className="w-full bg-background/50 border-primary/30 text-white placeholder:text-white/40 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-1 text-white">
              <Star className="h-3 w-3 text-primary" />
              <span>Nível de Habilidade</span>
            </Label>
            <div className="flex items-center gap-1 p-3 bg-background/50 border border-primary/30 rounded-md">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, skill_level: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                  aria-label={`Nível ${star}`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= formData.skill_level
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-white/30'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-white/60">
                {['', 'Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Profissional'][formData.skill_level]}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center space-x-1 text-white">
              <Upload className="h-3 w-3 text-primary" />
              <span>Foto do Jogador</span>
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full bg-background/50 border-primary/30 text-white file:text-white"
            />
            {imageFile && (
              <p className="text-sm text-white/60">
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