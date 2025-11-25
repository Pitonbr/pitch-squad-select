import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, Crown, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TeamMemberWithProfile {
  id: string;
  profile_id: string;
  role: 'admin' | 'player';
  joined_at: string;
  profile: {
    display_name: string | null;
    user_id: string;
  };
  player: {
    name: string;
    nickname: string;
    profile_image: string | null;
  } | null;
}

export const RoleManagement = () => {
  const { activeTeam, isTeamAdmin, refreshTeams } = useTeams();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    memberId: string;
    newRole: 'admin' | 'player';
    memberName: string;
  }>({
    open: false,
    memberId: '',
    newRole: 'player',
    memberName: ''
  });

  useEffect(() => {
    if (activeTeam && isTeamAdmin(activeTeam.id)) {
      fetchTeamMembers();
    }
  }, [activeTeam]);

  const fetchTeamMembers = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          profile_id,
          role,
          joined_at,
          profiles:profile_id (
            display_name,
            user_id
          )
        `)
        .eq('team_id', activeTeam.id)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch player info for each member
      const membersWithPlayers = await Promise.all(
        (data || []).map(async (member) => {
          const { data: playerData } = await supabase
            .from('players')
            .select('name, nickname, profile_image')
            .eq('profile_id', member.profile_id)
            .eq('team_id', activeTeam.id)
            .maybeSingle();

          return {
            ...member,
            role: member.role as 'admin' | 'player',
            profile: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles,
            player: playerData
          };
        })
      );

      setMembers(membersWithPlayers);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Erro ao carregar membros",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'player') => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const memberName = member.player?.name || member.profile?.display_name || 'Membro';

    setConfirmDialog({
      open: true,
      memberId,
      newRole,
      memberName
    });
  };

  const confirmRoleChange = async () => {
    const { memberId, newRole } = confirmDialog;
    
    try {
      setChangingRole(memberId);

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Papel atualizado!",
        description: `${confirmDialog.memberName} agora é ${newRole === 'admin' ? 'administrador' : 'jogador'}.`
      });

      await fetchTeamMembers();
      await refreshTeams();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro ao atualizar papel",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setChangingRole(null);
      setConfirmDialog({ open: false, memberId: '', newRole: 'player', memberName: '' });
    }
  };

  const getRoleBadge = (role: 'admin' | 'player') => {
    if (role === 'admin') {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30">
          <Crown className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-border/50">
        <Users className="h-3 w-3 mr-1" />
        Jogador
      </Badge>
    );
  };

  if (!activeTeam || !isTeamAdmin(activeTeam.id)) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem gerenciar papéis dos membros.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Papéis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando membros...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const adminCount = members.filter(m => m.role === 'admin').length;

  return (
    <>
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Papéis
          </CardTitle>
          <CardDescription>
            Defina quem pode administrar o time. Pelo menos um administrador é necessário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-border/50 bg-muted/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Administradores</strong> têm acesso total ao gerenciamento do time.
              <br />
              <strong>Jogadores</strong> têm acesso visual e podem fazer check-in em jogos.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {members.map((member) => {
              const isLastAdmin = member.role === 'admin' && adminCount === 1;
              const isChanging = changingRole === member.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.player?.profile_image || undefined} />
                      <AvatarFallback>
                        {(member.player?.name || member.profile?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.player?.name || member.profile?.display_name || 'Sem nome'}
                      </p>
                      {member.player?.nickname && (
                        <p className="text-sm text-muted-foreground">
                          "{member.player.nickname}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(member.role)}
                    
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'player')}
                      disabled={isLastAdmin || isChanging}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="player">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Jogador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {isLastAdmin && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Último admin
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum membro encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de papel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar <strong>{confirmDialog.memberName}</strong> para{' '}
              <strong>{confirmDialog.newRole === 'admin' ? 'Administrador' : 'Jogador'}</strong>?
              
              {confirmDialog.newRole === 'admin' ? (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>Administradores</strong> terão acesso total para:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>• Gerenciar jogadores e jogos</li>
                    <li>• Acessar controle financeiro</li>
                    <li>• Aprovar solicitações</li>
                    <li>• Modificar configurações do time</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-lg bg-muted border border-border">
                  <p className="text-sm text-foreground">
                    <strong>Jogadores</strong> terão acesso apenas para visualização e:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                    <li>• Fazer check-in em jogos</li>
                    <li>• Ver estatísticas do time</li>
                    <li>• Visualizar informações financeiras</li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
