import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TeamSelector } from "@/components/TeamSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { VersionIndicator } from "@/components/VersionIndicator";
import { RealtimeIndicator } from "@/components/RealtimeIndicator";
import logoImage from "@/assets/soccer-squad-logo.jpeg";
import { Trophy, Users, Plus, Settings, Bell, Play, Award, Gamepad2, DollarSign, LogOut, UserCog, UserPlus, FileText, ShieldCheck } from "lucide-react";
type ViewType = "dashboard" | "players" | "addPlayer" | "games" | "addGame" | "tournaments" | "liveGame" | "rankings" | "teamManager" | "finances" | "requests" | "joinRequests" | "audit" | "management";
interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}
export function Header({
  currentView,
  onViewChange
}: HeaderProps) {
  const {
    profile,
    signOut
  } = useAuth();
  const {
    activeTeam,
    teams,
    getUserRole
  } = useTeams();
  const navItems = [{
    key: 'dashboard',
    label: 'Dashboard',
    icon: Trophy
  }, {
    key: 'players',
    label: 'Jogadores',
    icon: Users
  }, {
    key: 'games',
    label: 'Jogos',
    icon: Plus
  }, {
    key: 'tournaments',
    label: 'Campeonatos',
    icon: Gamepad2
  }, {
    key: 'liveGame',
    label: 'Jogo Ativo',
    icon: Play
  }, {
    key: 'rankings',
    label: 'Rankings',
    icon: Award
  }, {
    key: 'teamManager',
    label: 'Gerenciar Time',
    icon: UserCog
  }, {
    key: 'finances',
    label: 'Financeiro',
    icon: DollarSign
  }, {
    key: 'requests',
    label: 'Solicitações',
    icon: UserPlus
  }, {
    key: 'joinRequests',
    label: 'Entrar no Time',
    icon: UserPlus
  }, {
    key: 'audit',
    label: 'Auditoria',
    icon: FileText
  }] as const;

  // Filter navigation items based on team membership and role
  const filteredNavItems = navItems.filter(item => {
    if (!activeTeam) return false;
    
    const userRole = getUserRole(activeTeam.id);
    
    // Admin sees everything
    if (userRole === 'admin') return true;
    
    // Player sees only these items (read-only views)
    if (userRole === 'player') {
      const playerAllowedItems = ['dashboard', 'players', 'tournaments', 'liveGame', 'rankings', 'finances'];
      return playerAllowedItems.includes(item.key);
    }
    
    return false;
  });
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  return <header className="bg-black/60 backdrop-blur-md border-b border-primary/30">
      <div className="container mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img src={logoImage} alt="Soccer Squad Logo" className="h-12 w-12 rounded-xl object-contain shadow-[0_0_30px_rgba(63,184,175,0.6)] ring-4 ring-primary/30" />
            <div>
              <h1 className="text-xl font-bold text-white text-glow-cyan">Soccer Squad</h1>
              <p className="text-xs text-cyan-100/95">Gestão de Partidas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              
              <ThemeSelector />
              
              {/* Manage Team Button */}
              
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{profile?.display_name || 'Usuário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  {activeTeam && getUserRole(activeTeam.id) === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewChange('management')}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Gerenciamento
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <VersionIndicator />
              <RealtimeIndicator />
              
              <Badge className="bg-primary text-white border-none">
                Beta
              </Badge>
            </div>
          </div>
        </div>

        {/* Team Selector with Active Team */}
        <div className="mb-3 flex items-center justify-center">
          <TeamSelector onCreateTeam={() => onViewChange("teamManager")} />
        </div>

        {/* Navigation */}
        <nav className="flex space-x-1 overflow-x-auto">
          {filteredNavItems.map(item => <Button key={item.key} variant={currentView === item.key ? "default" : "ghost"} className={`flex items-center space-x-2 whitespace-nowrap transition-colors font-medium ${currentView === item.key ? "bg-primary text-white shadow-[0_0_20px_rgba(63,184,175,0.5)] border-b-2 border-accent" : "text-white/90 hover:text-white hover:bg-white/20"}`} onClick={() => onViewChange(item.key)}>
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>)}
        </nav>
      </div>
    </header>;
}