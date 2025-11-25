import { ReactNode } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGateProps {
  requiredRole: 'admin' | 'player';
  teamId?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const PermissionGate = ({ 
  requiredRole, 
  teamId, 
  children, 
  fallback,
  showMessage = false 
}: PermissionGateProps) => {
  const { activeTeam, getUserRole } = useTeams();
  
  const checkTeamId = teamId || activeTeam?.id;
  
  if (!checkTeamId) {
    return fallback || null;
  }

  const userRole = getUserRole(checkTeamId);
  
  if (!userRole) {
    return fallback || null;
  }

  // Check permission
  const hasPermission = requiredRole === 'admin' 
    ? userRole === 'admin' 
    : true; // Players can see player-level content

  if (!hasPermission) {
    if (showMessage) {
      return (
        <Alert className="border-border/50 bg-card/50 backdrop-blur">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback || null;
  }

  return <>{children}</>;
};
