import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/ImageCropper";
import { Users, Plus, Crown, Copy, UserPlus, Share, Upload, Camera } from "lucide-react";

export function TeamManager() {
  const { createTeam, joinTeamByCode, userTeams, isTeamAdmin, uploadTeamLogo } = useTeams();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [dragTeamId, setDragTeamId] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState({
    name: "",
    description: ""
  });
  
  const [joinCode, setJoinCode] = useState("");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setIsLoading(true);
    try {
      const newTeam = await createTeam(createForm.name, createForm.description);
      if (newTeam) {
        setCreateForm({ name: "", description: "" });
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsLoading(true);
    try {
      const success = await joinTeamByCode(joinCode.trim());
      if (success) {
        setJoinCode("");
        setIsJoinDialogOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processImageFile = (file: File, teamId: string) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setSelectedTeamId(teamId);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>, teamId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, teamId);
    }
  };

  const handleDragOver = (e: React.DragEvent, teamId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTeamId(teamId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTeamId(null);
  };

  const handleDrop = (e: React.DragEvent, teamId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTeamId(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, teamId);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!selectedTeamId) return;

    setIsLoading(true);
    try {
      const file = new File([blob], 'team-logo.jpg', { type: 'image/jpeg' });
      await uploadTeamLogo(selectedTeamId, file);
      setIsCropperOpen(false);
      setSelectedImage(null);
      setSelectedTeamId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async (inviteCode: string, teamName: string) => {
    const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copiado!",
        description: `Link de convite para ${teamName} copiado para a área de transferência.`
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      toast({
        title: "Link copiado!",
        description: `Link de convite para ${teamName} copiado para a área de transferência.`
      });
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Times</h2>
          <p className="text-muted-foreground">
            Crie novos times ou participe de times existentes
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Entrar em Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrar em um Time</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Código de Convite</Label>
                  <Input
                    id="join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Cole o código de convite aqui"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar no Time"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Time</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Nome do Time *</Label>
                  <Input
                    id="team-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ex: Atlético do João"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team-description">Descrição (opcional)</Label>
                  <Textarea
                    id="team-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Descreva seu time..."
                    rows={3}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Time"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {userTeams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum time encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não faz parte de nenhum time. Crie um novo time ou entre em um existente.
            </p>
            <div className="flex space-x-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Time
              </Button>
              <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Entrar em Time
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userTeams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{team.name}</span>
                  </CardTitle>
                  {isTeamAdmin(team.id) && (
                    <Badge variant="secondary">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {isTeamAdmin(team.id) ? (
                    <div 
                      className={`relative group border-2 border-dashed rounded-full transition-all ${
                        dragTeamId === team.id 
                          ? 'border-primary bg-primary/10 scale-105' 
                          : 'border-transparent hover:border-primary/50'
                      }`}
                      onDragOver={(e) => handleDragOver(e, team.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, team.id)}
                    >
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={team.logo_url || ''} alt={team.name} />
                        <AvatarFallback className="text-xl">
                          {team.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor={`logo-upload-${team.id}`}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                      >
                        {dragTeamId === team.id ? (
                          <Upload className="h-6 w-6 text-white animate-bounce" />
                        ) : (
                          <>
                            <Camera className="h-6 w-6 text-white" />
                            <span className="text-xs text-white mt-1">Arraste ou clique</span>
                          </>
                        )}
                        <input
                          id={`logo-upload-${team.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoSelect(e, team.id)}
                        />
                      </label>
                    </div>
                  ) : (
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={team.logo_url || ''} alt={team.name} />
                      <AvatarFallback className="text-xl">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {team.description}
                  </p>
                )}
                
                {isTeamAdmin(team.id) && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Código de Convite
                          </p>
                          <p className="font-mono text-sm">{team.invite_code}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyInviteCode(team.invite_code, team.name)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => copyInviteCode(team.invite_code, team.name)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Compartilhar Convite
                    </Button>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedImage && (
        <ImageCropper
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setSelectedImage(null);
            setSelectedTeamId(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}