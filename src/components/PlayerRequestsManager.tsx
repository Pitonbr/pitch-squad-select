import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Users, Clock, Mail, Phone, MapPin, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useRealtime } from "@/hooks/useRealtime";

interface PlayerRequest {
  id: string;
  name: string;
  nickname: string;
  player_position: string;
  phone: string;
  email: string;
  jersey_number?: number;
  profile_image?: string;
  created_at: string;
  requested_by_name: string;
}

export function PlayerRequestsManager() {
  const { toast } = useToast();
  const { activeTeam } = useTeams();
  const [requests, setRequests] = useState<PlayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Listen for realtime updates on player requests
  useRealtime({
    table: 'player_requests',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: (event) => {
      console.log('[PlayerRequestsManager] Realtime event:', event);
      
      if (event.eventType === 'INSERT' && event.new) {
        // Add new request to the list
        setRequests(prev => [event.new, ...prev]);
        toast({
          title: "Nova Solicitação",
          description: `${event.new.name} solicitou entrar no time`,
        });
      } else if (event.eventType === 'UPDATE' && event.new) {
        // Update existing request
        setRequests(prev => prev.map(req => 
          req.id === event.new.id ? event.new : req
        ));
      } else if (event.eventType === 'DELETE' && event.old) {
        // Remove deleted request
        setRequests(prev => prev.filter(req => req.id !== event.old.id));
      }
    }
  });

  const fetchRequests = async () => {
    if (!activeTeam?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_pending_player_requests', { _team_id: activeTeam.id });

      if (error) {
        throw error;
      }

      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTeam?.id]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    
    try {
      const { data, error } = await supabase
        .rpc('approve_player_request', { _request_id: requestId });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (result.success) {
        toast({
          title: "Jogador aprovado!",
          description: result.message,
        });
        fetchRequests(); // Refresh the list
      } else {
        toast({
          title: "Erro na aprovação",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Erro na aprovação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    
    try {
      const { data, error } = await supabase
        .rpc('reject_player_request', { _request_id: requestId });

      if (error) {
        throw error;
      }

      const result = data[0];
      if (result.success) {
        toast({
          title: "Solicitação rejeitada",
          description: result.message,
        });
        fetchRequests(); // Refresh the list
      } else {
        toast({
          title: "Erro na rejeição",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erro na rejeição",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Solicitações de Jogadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Solicitações de Jogadores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Solicitações de Jogadores</span>
          </div>
          <Badge variant="secondary">{requests.length} pendente(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 text-center">
                    <Avatar className="h-12 w-12 mx-auto">
                      <AvatarImage src={request.profile_image} alt={request.name} />
                      <AvatarFallback className="text-sm font-semibold">
                        {request.jersey_number || request.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {request.jersey_number && (
                      <Badge variant="outline" className="text-xs font-bold mt-1">
                        #{request.jersey_number}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{request.name}</h3>
                      <Badge variant="secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {request.player_position}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">"{request.nickname}"</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {request.phone}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {request.email}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-3">
                      Solicitado por: {request.requested_by_name} • {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processing === request.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {processing === request.id ? "Aprovando..." : "Aprovar"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        {processing === request.id ? "Rejeitando..." : "Rejeitar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}