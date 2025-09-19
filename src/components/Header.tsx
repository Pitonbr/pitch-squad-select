import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TeamSelector } from "@/components/TeamSelector";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { VersionIndicator } from "@/components/VersionIndicator";
import { 
  Trophy, 
  Users, 
  Plus,
  Settings,
  Bell,
  Play,
  Award,
  Gamepad2,
  DollarSign,
  LogOut,
  UserCog
} from "lucide-react";

interface HeaderProps {
  currentView: "dashboard" | "players" | "games" | "live" | "rankings" | "tournaments" | "financial" | "teams";
  onViewChange: (view: "dashboard" | "players" | "games" | "live" | "rankings" | "tournaments" | "financial" | "teams") => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { activeTeam } = useTeams();

  const navigationItems = [
    {
      key: "dashboard" as const,
      label: "Dashboard",
      icon: Trophy
    },
    {
      key: "players" as const,
      label: "Jogadores",
      icon: Users
    },
    {
      key: "games" as const,
      label: "Jogos",
      icon: Plus
    },
    {
      key: "tournaments" as const,
      label: "Campeonatos",
      icon: Gamepad2
    },
    {
      key: "live" as const,
      label: "Jogo Ativo",
      icon: Play
    },
    {
      key: "rankings" as const,
      label: "Rankings",
      icon: Award
    },
    {
      key: "financial" as const,
      label: "Financeiro",
      icon: DollarSign
    },
    {
      key: "teams" as const,
      label: "Times",
      icon: UserCog
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 hero-gradient rounded-xl">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Soccer Squad</h1>
              <p className="text-xs text-muted-foreground">Gestão de Partidas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Team Selector */}
            <TeamSelector onCreateTeam={() => onViewChange("teams")} />
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
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
                  <DropdownMenuItem onClick={() => onViewChange("teams")}>
                    <UserCog className="h-4 w-4 mr-2" />
                    Gerenciar Times
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <VersionIndicator />
              
              <Badge className="field-gradient text-white">
                Beta
              </Badge>
            </div>
          </div>
        </div>

        {/* Active Team Indicator */}
        {activeTeam && (
          <div className="mb-4 p-2 bg-muted rounded-lg">
            <p className="text-sm text-center">
              <span className="text-muted-foreground">Time ativo:</span>{" "}
              <span className="font-medium">{activeTeam.name}</span>
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex space-x-1 overflow-x-auto">
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              variant={currentView === item.key ? "default" : "ghost"}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                currentView === item.key ? "field-gradient text-white" : ""
              }`}
              onClick={() => onViewChange(item.key)}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}