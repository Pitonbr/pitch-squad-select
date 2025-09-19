import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Key } from "lucide-react";

export function TeamOnboarding() {
  const { createTeam, joinTeamByCode } = useTeams();
  const { profile, user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    name: "",
    description: ""
  });
  
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    
    // Enhanced pre-creation checks
    if (!profile) {
      toast({
        title: "Erro de autenticação",
        description: "Perfil não carregado. Aguarde ou faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !session) {
      toast({
        title: "Erro de autenticação", 
        description: "Sessão não encontrada. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    console.log('TeamOnboarding: Starting team creation with checks passed', {
      hasProfile: !!profile,
      hasUser: !!user, 
      hasSession: !!session,
      profileId: profile.id,
      teamName: createForm.name
    });
    
    setIsLoading(true);
    try {
      const team = await createTeam(createForm.name, createForm.description);
      if (team) {
        console.log('TeamOnboarding: Team created successfully', team);
        setIsCreateDialogOpen(false);
        setCreateForm({ name: "", description: "" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setIsLoading(true);
    try {
      const success = await joinTeamByCode(inviteCode.trim());
      if (success) {
        setIsJoinDialogOpen(false);
        setInviteCode("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">
            ⚽ Bem-vindo ao Soccer Manager
          </CardTitle>
          <p className="text-muted-foreground">
            Olá <strong>{profile?.display_name}</strong>! Para começar a usar o app, você precisa estar associado a um time.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Create Team Option */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-semibold mb-2">Criar Meu Time</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Monte seu próprio time e seja o administrador
                    </p>
                    <Badge variant="secondary">Você será o Admin</Badge>
                  </CardContent>
                </Card>
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
                      placeholder="Ex: Flamengo FC"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-description">Descrição (opcional)</Label>
                    <Input
                      id="team-description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Breve descrição do time"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading || !createForm.name.trim() || !profile || !user || !session || authLoading}>
                      {isLoading ? "Criando..." : authLoading ? "Carregando..." : "Criar Time"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Join by Code Option */}
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Key className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-semibold mb-2">Tenho Código de Convite</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Já recebi um código de convite de um time
                    </p>
                    <Badge variant="outline">Entrada Imediata</Badge>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrar com Código de Convite</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">Código de Convite</Label>
                    <Input
                      id="invite-code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Cole o código aqui"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsJoinDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading || !inviteCode.trim()}>
                      {isLoading ? "Entrando..." : "Entrar no Time"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Search Teams Option */}
            <Card className="border-2 opacity-70">
              <CardContent className="p-6 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Buscar Times</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Procurar times públicos para solicitar entrada
                </p>
                <Badge variant="secondary">Em Breve</Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>
              💡 <strong>Dica:</strong> Se você recebeu um link de convite, abra-o no navegador para entrar automaticamente no time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}