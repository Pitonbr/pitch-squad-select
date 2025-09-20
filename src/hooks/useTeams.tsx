import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
  treasurer_id: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  role: 'admin' | 'player';
  joined_at: string;
}

interface TeamsContextType {
  teams: Team[];
  activeTeam: Team | null;
  userTeams: Team[];
  loading: boolean;
  setActiveTeam: (team: Team | null) => void;
  createTeam: (name: string, description?: string) => Promise<Team | null>;
  joinTeamByCode: (inviteCode: string) => Promise<boolean>;
  refreshTeams: () => Promise<void>;
  isTeamAdmin: (teamId: string) => boolean;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { profile, user, session } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teams when profile is available
  useEffect(() => {
    if (profile) {
      refreshTeams();
    } else {
      setTeams([]);
      setUserTeams([]);
      setActiveTeam(null);
      setLoading(false);
    }
  }, [profile]);

  // Set first team as active if none selected
  useEffect(() => {
    if (userTeams.length > 0 && !activeTeam) {
      setActiveTeam(userTeams[0]);
    }
  }, [userTeams, activeTeam]);

  const refreshTeams = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get user's teams through team_members
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams (
            id,
            name,
            description,
            admin_id,
            treasurer_id,
            invite_code,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', profile.id);

      if (teamMemberships) {
        const userTeamsList = teamMemberships
          .map(membership => membership.teams as Team)
          .filter(Boolean);
        
        setUserTeams(userTeamsList);
        setTeams(userTeamsList);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Erro ao carregar times",
        description: "Não foi possível carregar seus times.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string, description?: string): Promise<Team | null> => {
    console.log('[useTeams] Creating team using secure function...', {
      hasProfile: !!profile,
      profileId: profile?.id,
      hasSession: !!session,
      sessionId: session?.user?.id,
      teamName: name
    });

    if (!session?.user) {
      console.error('[useTeams] No authenticated session found');
      toast({
        title: "Erro de autenticação",
        description: "Sessão não encontrada. Faça login novamente.",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log('[useTeams] Calling create_team_secure function...');

      // Use the secure function instead of direct insert with new parameters
      const { data, error } = await supabase.rpc('create_team_secure', {
        _team_name: name,
        _team_description: description || null,
        _state: null,
        _city: null,
        _public_description: null
      });

      if (error) {
        console.error('[useTeams] Error calling secure function:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        let errorMessage = "Não foi possível criar o time.";
        if (error.message.includes('não autenticado')) {
          errorMessage = "Usuário não autenticado. Faça login novamente.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Erro ao criar time",
          description: errorMessage,
          variant: "destructive"
        });
        return null;
      }

      console.log('[useTeams] Secure function response:', data);

      if (!data || data.length === 0) {
        toast({
          title: "Erro ao criar time",
          description: "Nenhum dado retornado do servidor.",
          variant: "destructive"
        });
        return null;
      }

      const result = data[0];
      
      if (!result.success) {
        console.error('[useTeams] Team creation failed:', result.message);
        toast({
          title: "Erro ao criar time",
          description: result.message,
          variant: "destructive"
        });
        return null;
      }

      console.log('[useTeams] Team created successfully via secure function:', result);

      toast({
        title: "Time criado!",
        description: `${result.team_name} foi criado com sucesso. Você foi automaticamente adicionado como jogador.`
      });

      // Refresh teams to get the updated list
      await refreshTeams();
      
      // Find and set the new team as active
      const newTeam = userTeams.find(team => team.id === result.team_id);
      if (newTeam) {
        setActiveTeam(newTeam);
        return newTeam;
      }
      
      // Fallback - create a team object if not found in userTeams yet
      const fallbackTeam = {
        id: result.team_id,
        name: result.team_name,
        description: description || null,
        admin_id: profile?.id || '',
        treasurer_id: null,
        invite_code: '', // Will be loaded when teams refresh
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setActiveTeam(fallbackTeam);
      return fallbackTeam;
    } catch (error: any) {
      console.error('[useTeams] Final error in createTeam:', error);
      toast({
        title: "Erro ao criar time",
        description: "Falha inesperada ao criar o time. Tente novamente.",
        variant: "destructive"
      });
      return null;
    }
  };

  const joinTeamByCode = async (inviteCode: string): Promise<boolean> => {
    if (!profile) return false;

    try {
      // Use secure function to join team by invite code
      const { data, error } = await supabase
        .rpc('join_team_by_invite_code', {
          _invite_code: inviteCode,
          _profile_id: profile.id
        });

      if (error) throw error;

      const result = data[0];
      
      if (!result.success) {
        toast({
          title: "Não foi possível entrar no time",
          description: result.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Entrou no time!",
        description: result.message
      });

      // Refresh teams
      await refreshTeams();

      return true;
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast({
        title: "Erro ao entrar no time",
        description: error.message || "Não foi possível entrar no time.",
        variant: "destructive"
      });
      return false;
    }
  };

  const isTeamAdmin = (teamId: string): boolean => {
    if (!profile) return false;
    const team = teams.find(t => t.id === teamId);
    return team?.admin_id === profile.id;
  };

  const value = {
    teams,
    activeTeam,
    userTeams,
    loading,
    setActiveTeam,
    createTeam,
    joinTeamByCode,
    refreshTeams,
    isTeamAdmin
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}