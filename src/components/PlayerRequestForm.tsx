import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Phone, User, MapPin, Mail, Hash, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PlayerRequestFormData {
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email: string;
  jersey_number: string;
}

interface PlayerRequestFormProps {
  teamId: string;
  onRequestSubmitted: () => void;
}

const positions = [
  "Goleiro",
  "Zagueiro", 
  "Lateral",
  "Volante",
  "Meia",
  "Atacante"
];

export function PlayerRequestForm({ teamId, onRequestSubmitted }: PlayerRequestFormProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState<PlayerRequestFormData>({
    name: "",
    nickname: "",
    position: "",
    phone: "",
    email: "",
    jersey_number: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nickname || !formData.position || !formData.phone || !formData.email) {
      toast({
        title: "Erro na solicitação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer essa solicitação.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      let profileImageUrl = null;
      if (imageFile) {
        profileImageUrl = await handleImageUpload(imageFile);
        if (!profileImageUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('player_requests')
        .insert({
          team_id: teamId,
          name: formData.name,
          nickname: formData.nickname,
          player_position: formData.position,
          phone: formData.phone,
          email: formData.email,
          jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
          profile_image: profileImageUrl,
          requested_by: profile.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação foi enviada para o administrador do time.",
      });

      setFormData({
        name: "",
        nickname: "",
        position: "",
        phone: "",
        email: "",
        jersey_number: ""
      });
      setImageFile(null);
      onRequestSubmitted();

    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Não foi possível enviar a solicitação.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <span>Solicitar Entrada no Time</span>
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

          <Button type="submit" className="w-full field-gradient font-semibold" disabled={submitting}>
            <UserPlus className="h-4 w-4 mr-2" />
            {submitting ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}