import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Users, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TeamPublicProfile } from "./TeamPublicProfile";

interface Team {
  id: string;
  name: string;
  description: string;
  public_description: string;
  state: string;
  city: string;
  member_count: number;
  created_at: string;
}

interface BrazilianState {
  code: string;
  name: string;
}

export function TeamSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [states, setStates] = useState<BrazilianState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadStates();
      searchTeams();
    }
  }, [isOpen]);

  const loadStates = async () => {
    try {
      const { data, error } = await supabase.rpc('get_brazilian_states');
      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Error loading states:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os estados.",
        variant: "destructive",
      });
    }
  };

  const searchTeams = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_teams', {
        _search_term: searchTerm || null,
        _state: selectedState || null,
        _city: selectedCity || null,
        _limit: 20
      });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error searching teams:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar times.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchTeams();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (selectedTeam) {
    return (
      <TeamPublicProfile 
        team={selectedTeam} 
        onBack={() => setSelectedTeam(null)}
        onClose={() => {
          setSelectedTeam(null);
          setIsOpen(false);
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full">
          <Search className="h-5 w-5 mr-2" />
          BUSCAR TIME
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Times
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros de Busca */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Nome do time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.code} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Cidade..."
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            />
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? "Buscando..." : "Buscar Times"}
          </Button>

          {/* Resultados */}
          <div className="space-y-4">
            {teams.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum time encontrado. Tente ajustar os filtros de busca.
                </CardContent>
              </Card>
            )}

            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        {team.state && team.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {team.city}, {team.state}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {team.member_count} membros
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Criado em {formatDate(team.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Público</Badge>
                  </div>
                </CardHeader>
                {team.public_description && (
                  <CardContent className="pt-0 pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {team.public_description}
                    </p>
                  </CardContent>
                )}
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => setSelectedTeam(team)}
                    className="w-full"
                  >
                    Ver Time
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}