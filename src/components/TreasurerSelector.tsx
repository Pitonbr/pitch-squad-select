import React from 'react';
import { useTeams } from '@/hooks/useTeams';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Crown, Wallet } from 'lucide-react';

export const TreasurerSelector: React.FC = () => {
  const { activeTeam, isTeamAdmin } = useTeams();

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', activeTeam?.id],
    queryFn: async () => {
      if (!activeTeam) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          profiles!inner (
            id,
            display_name
          )
        `)
        .eq('team_id', activeTeam.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTeam
  });

  const { data: currentTeam, refetch: refetchTeam } = useQuery({
    queryKey: ['team-with-treasurer', activeTeam?.id],
    queryFn: async () => {
      if (!activeTeam) return null;

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          treasurer:profiles!teams_treasurer_id_fkey (
            id,
            display_name
          )
        `)
        .eq('id', activeTeam.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!activeTeam
  });

  const handleTreasurerChange = async (profileId: string) => {
    if (!activeTeam || !isTeamAdmin(activeTeam.id)) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ treasurer_id: profileId === 'none' ? null : profileId })
        .eq('id', activeTeam.id);

      if (error) throw error;

      await refetchTeam();
      toast({
        title: 'Sucesso',
        description: profileId === 'none' 
          ? 'Tesoureiro removido com sucesso!'
          : 'Tesoureiro designado com sucesso!'
      });
    } catch (error) {
      console.error('Error updating treasurer:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar tesoureiro.',
        variant: 'destructive'
      });
    }
  };

  if (!activeTeam || !isTeamAdmin(activeTeam.id)) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Configuração de Tesoureiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Configuração de Tesoureiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Designar Tesoureiro</label>
          <Select
            value={currentTeam?.treasurer_id || 'none'}
            onValueChange={handleTreasurerChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar tesoureiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum tesoureiro</SelectItem>
              {teamMembers?.map((member) => (
                <SelectItem key={member.profiles.id} value={member.profiles.id}>
                  <div className="flex items-center gap-2">
                    <span>{member.profiles.display_name}</span>
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentTeam?.treasurer && (
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="font-medium">Tesoureiro atual:</span>
              <Badge variant="outline">
                {currentTeam.treasurer.display_name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              O tesoureiro tem acesso total às funcionalidades financeiras do time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};