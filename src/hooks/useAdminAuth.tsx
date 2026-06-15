import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthContextType {
  isAdmin: boolean;
  loading: boolean;
  checkAdmin: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsAdmin(false); return false; }

    const { data, error } = await supabase.rpc("is_master_admin");
    const result = !error && data === true;
    setIsAdmin(result);
    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  useEffect(() => {
    checkAdmin().finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin().finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, checkAdmin, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
