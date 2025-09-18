import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Calendar,
  Trophy,
  RefreshCw
} from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";

export function LiveGame() {
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [availableGames, setAvailableGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeTeam } = useTeams();

  useEffect(() => {
    if (activeTeam) {
      fetchAvailableGames();
    }
  }, [activeTeam]);

  const fetchAvailableGames = async () => {
    try {
      setLoading(true);
      
      // Buscar jogos agendados para hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', activeTeam.id)
        .eq('date', today)
        .in('status', ['scheduled', 'in_progress'])
        .order('time', { ascending: true });

      setAvailableGames(games || []);
      
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando jogos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se nenhum jogo estiver disponível para hoje
  if (availableGames.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum jogo hoje</h3>
            <p className="text-muted-foreground mb-4">
              Não há jogos agendados para hoje. Quando um jogo for marcado, você poderá acompanhá-lo aqui em tempo real.
            </p>
            <Badge variant="outline">
              Aguardando próximo jogo
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se nenhum jogo foi selecionado, mostrar lista de jogos disponíveis
  if (!selectedGame) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Jogos Disponíveis Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableGames.map((game) => (
                <div 
                  key={game.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer smooth-transition"
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{game.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {game.time} • {game.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={game.status === 'in_progress' ? 'default' : 'secondary'}>
                      {game.status === 'in_progress' ? 'Em andamento' : 'Agendado'}
                    </Badge>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface do jogo ao vivo seria implementada aqui
  // Por agora, apenas mostramos informações básicas do jogo selecionado
  return (
    <div className="space-y-6">
      <Card className="field-gradient text-white">
        <CardContent className="py-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{selectedGame.title}</h2>
            <p className="text-sm opacity-90">{selectedGame.location} • {selectedGame.time}</p>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {selectedGame.status === 'in_progress' ? 'Em andamento' : 'Pronto para começar'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Funcionalidade em Desenvolvimento</h3>
          <p className="text-muted-foreground mb-4">
            O sistema de jogo ao vivo com placar, estatísticas e formações está sendo desenvolvido.
          </p>
          <Button variant="outline" onClick={() => setSelectedGame(null)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Voltar para jogos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}