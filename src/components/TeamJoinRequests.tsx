import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { UserPlus, Check, X, Clock, Calendar, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useTeams";

interface JoinRequest {
  id: string;
  team_id: string;
  requesting_player_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  requesting_player_name: string;
  game_info?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export function TeamJoinRequests() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { toast } = useToast();
  const { activeTeam, isTeamAdmin } = useTeams();

  useEffect(() => {
    if (activeTeam && isTeamAdmin(activeTeam.id)) {
      loadJoinRequests();
    }
  }, [activeTeam]);

  const loadJoinRequests = async () => {
    if (!activeTeam) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_join_requests')
        .select(`
          *,
          profiles!team_join_requests_requesting_player_id_fkey (
            display_name
          ),
          games (
            title,
            date,
            time,
            location
          )
        `)
        .eq('team_id', activeTeam.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = (data?.map(request => ({
        ...request,
        requesting_player_name: request.profiles?.display_name || 'Usuário sem nome',
        status: request.status as 'pending' | 'approved' | 'rejected',
        game_info: request.games
      })) || []) as JoinRequest[];

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading join requests:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de entrada.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingRequest(requestId);
    try {
      const { data, error } = await supabase.rpc('process_team_join_request', {
        _request_id: requestId,
        _action: action
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: action === 'approve' ? "Solicitação Aprovada" : "Solicitação Rejeitada",
          description: result.message,
        });

        // Send email notification
        if (result.player_email) {
          try {
            await supabase.functions.invoke('send-join-request-notification', {
              body: {
                to: result.player_email,
                action: action,
                playerName: result.player_name,
                teamName: result.team_name,
                gameTitle: result.game_title
              }
            });
          } catch (emailError) {
            console.error('Error sending notification email:', emailError);
            // Don't show error to user as the main action succeeded
          }
        }

        loadJoinRequests(); // Reload to get updated data
      } else {
        toast({
          title: "Erro",
          description: result?.message || "Erro ao processar solicitação.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação.",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleBatchProcess = async (action: 'approve' | 'reject') => {
    if (selectedRequests.size === 0) return;

    setIsBatchProcessing(true);
    const selectedIds = Array.from(selectedRequests);
    
    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (requestId) => {
          const { data, error } = await supabase.rpc('process_team_join_request', {
            _request_id: requestId,
            _action: action
          });

          if (error) throw error;

          const result = data?.[0];
          if (result?.success && result.player_email) {
            // Send email notification in background
            supabase.functions.invoke('send-join-request-notification', {
              body: {
                to: result.player_email,
                action: action,
                playerName: result.player_name,
                teamName: result.team_name,
                gameTitle: result.game_title
              }
            }).catch(err => console.error('Error sending notification email:', err));
          }
          
          return result;
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      toast({
        title: action === 'approve' ? "Solicitações Aprovadas" : "Solicitações Rejeitadas",
        description: `${successCount} processadas com sucesso${failCount > 0 ? `, ${failCount} falharam` : ''}.`,
      });

      setSelectedRequests(new Set());
      loadJoinRequests();
    } catch (error) {
      console.error('Error batch processing requests:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitações em lote.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === pendingRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (!activeTeam || !isTeamAdmin(activeTeam.id)) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Apenas administradores podem visualizar solicitações de entrada.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Carregando solicitações...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Solicitações de Entrada</h2>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processadas ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhuma solicitação pendente.
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingRequests.length > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedRequests.size === pendingRequests.length}
                          onCheckedChange={toggleSelectAll}
                          id="select-all"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Selecionar todas ({selectedRequests.size} de {pendingRequests.length})
                        </label>
                      </div>
                      {selectedRequests.size > 0 && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleBatchProcess('approve')}
                            disabled={isBatchProcessing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar Selecionados ({selectedRequests.size})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBatchProcess('reject')}
                            disabled={isBatchProcessing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar Selecionados ({selectedRequests.size})
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedRequests.has(request.id)}
                      onCheckedChange={() => toggleRequestSelection(request.id)}
                      id={`request-${request.id}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {request.requesting_player_name}
                          </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Solicitado em {formatDate(request.created_at)}
                        </div>
                        {request.game_info && (
                          <div className="flex items-center gap-1 text-primary">
                            <Gamepad2 className="h-3 w-3" />
                            Convite via jogo: {request.game_info.title}
                          </div>
                        )}
                      </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {request.message && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Mensagem:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {request.message}
                      </p>
                    </div>
                  </CardContent>
                )}
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleProcessRequest(request.id, 'approve')}
                      disabled={processingRequest === request.id}
                      className="flex-1"
                    >
                      {processingRequest === request.id ? "Processando..." : "Aprovar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleProcessRequest(request.id, 'reject')}
                      disabled={processingRequest === request.id}
                      className="flex-1"
                    >
                      {processingRequest === request.id ? "Processando..." : "Rejeitar"}
                    </Button>
                  </div>
                </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhuma solicitação processada.
              </CardContent>
            </Card>
          ) : (
            processedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {request.requesting_player_name}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Solicitado em {formatDate(request.created_at)}
                        </div>
                        {request.reviewed_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Processado em {formatDate(request.reviewed_at)}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                {request.message && (
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Mensagem:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {request.message}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}