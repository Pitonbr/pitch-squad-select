import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Plus,
  Settings,
  Bell,
  Play,
  Award,
  Gamepad2,
  DollarSign
} from "lucide-react";

interface HeaderProps {
  currentView: "dashboard" | "players" | "games" | "live" | "rankings" | "tournaments" | "financial";
  onViewChange: (view: "dashboard" | "players" | "games" | "live" | "rankings" | "tournaments" | "financial") => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
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
    }
  ];

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
              <h1 className="text-xl font-bold">Campo Squad</h1>
              <p className="text-xs text-muted-foreground">Gestão de Partidas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Badge className="field-gradient text-white">
              Beta
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex space-x-1">
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              variant={currentView === item.key ? "default" : "ghost"}
              className={`flex items-center space-x-2 ${
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