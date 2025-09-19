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
  const { profile, user } = useAuth();
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
    if (!profile) return null;

    try {
      console.log('Creating team with profile:', profile);
      console.log('User authenticated:', user);
      
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          admin_id: profile.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team member with admin role
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          profile_id: profile.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast({
        title: "Time criado!",
        description: `${name} foi criado com sucesso.`
      });

      // Refresh teams
      await refreshTeams();

      return teamData;
    } catch (error: any) {
      console.error('Error creating team:', error);
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