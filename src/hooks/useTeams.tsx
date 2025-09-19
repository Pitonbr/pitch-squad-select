import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
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
    // Enhanced authentication checks with detailed logging
    console.log('useTeams: Starting team creation process', {
      hasProfile: !!profile,
      hasUser: !!user,
      profileId: profile?.id,
      userId: user?.id,
      profileUserId: profile?.user_id
    });

    if (!profile) {
      console.error('useTeams: Cannot create team - no profile available');
      toast({
        title: "Erro de autenticação",
        description: "Perfil de usuário não encontrado. Tente fazer login novamente.",
        variant: "destructive"
      });
      return null;
    }

    if (!user) {
      console.error('useTeams: Cannot create team - no user available');
      toast({
        title: "Erro de autenticação", 
        description: "Usuário não autenticado. Tente fazer login novamente.",
        variant: "destructive"
      });
      return null;
    }

    // Verify session is active
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('useTeams: Cannot create team - no active session');
      toast({
        title: "Sessão expirada",
        description: "Sua sessão expirou. Faça login novamente.",
        variant: "destructive"
      });
      return null;
    }

    console.log('useTeams: Authentication verified, proceeding with team creation', {
      sessionValid: !!session,
      profileId: profile.id,
      teamName: name
    });

    return await createTeamWithRetry(name, description, profile, 0);
  };

  const createTeamWithRetry = async (
    name: string, 
    description: string | undefined, 
    userProfile: typeof profile,
    retryCount: number
  ): Promise<Team | null> => {
    const maxRetries = 2;
    
    try {
      console.log(`useTeams: Creating team attempt ${retryCount + 1}/${maxRetries + 1}`, {
        name,
        adminId: userProfile?.id,
        hasProfile: !!userProfile
      });

      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          admin_id: userProfile!.id
        })
        .select()
        .single();

      if (teamError) {
        console.error('useTeams: Team creation error:', teamError);
        
        // If it's a RLS policy error and we have retries left, wait and retry
        if (teamError.code === '42501' && retryCount < maxRetries) {
          console.log(`useTeams: RLS policy error, retrying in ${(retryCount + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
          return createTeamWithRetry(name, description, userProfile, retryCount + 1);
        }
        
        throw teamError;
      }

      console.log('useTeams: Team created successfully', teamData);

      // Add creator as team member with admin role
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          profile_id: userProfile!.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('useTeams: Team member creation error:', memberError);
        throw memberError;
      }

      console.log('useTeams: Team member added successfully');

      toast({
        title: "Time criado!",
        description: `${name} foi criado com sucesso.`
      });

      // Refresh teams
      await refreshTeams();

      return teamData;
    } catch (error: any) {
      console.error('useTeams: Error in createTeamWithRetry:', {
        error,
        retryCount,
        maxRetries,
        code: error.code,
        message: error.message
      });

      // If we've exhausted retries, show error
      if (retryCount >= maxRetries) {
        let errorMessage = "Não foi possível criar o time.";
        
        if (error.code === '42501') {
          errorMessage = "Erro de permissão. Verifique se você está autenticado corretamente.";
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

      // If we have retries left and it's a retryable error, retry
      if (error.code === '42501' || error.message?.includes('permission')) {
        console.log(`useTeams: Retryable error, attempting retry ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return createTeamWithRetry(name, description, userProfile, retryCount + 1);
      }

      // Non-retryable error
      toast({
        title: "Erro ao criar time",
        description: error.message || "Não foi possível criar o time.",
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