import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed', { event, hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile after state update
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session check', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
    try {
      console.log('useAuth: Fetching profile for user', userId, `(attempt ${retryCount + 1})`);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('useAuth: Error fetching profile:', error);
        
        // If profile doesn't exist and this is first attempt, try to create it
        if (error.code === 'PGRST116' && retryCount === 0) {
          console.log('useAuth: Profile not found, attempting to create one...');
          await createProfileForUser(userId);
          // Retry fetching after creation
          return fetchProfile(userId, retryCount + 1);
        }
        return;
      }
      
      if (!profileData && retryCount < 2) {
        console.log('useAuth: Profile is null, retrying in 500ms...');
        setTimeout(() => fetchProfile(userId, retryCount + 1), 500);
        return;
      }
      
      console.log('useAuth: Profile fetched successfully', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('useAuth: Exception fetching profile:', error);
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const createProfileForUser = async (userId: string) => {
    try {
      console.log('useAuth: Creating profile for user', userId);
      
      // Get current user's metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: user.user_metadata?.display_name || user.email,
          phone: user.user_metadata?.phone
        })
        .select()
        .single();

      if (error) {
        console.error('useAuth: Error creating profile:', error);
        return;
      }

      console.log('useAuth: Profile created successfully', data);
    } catch (error) {
      console.error('useAuth: Exception creating profile:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}