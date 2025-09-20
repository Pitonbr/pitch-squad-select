import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, MapPin, Users, Calendar, Send, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

interface TeamPublicProfileProps {
  team: Team;
  onBack: () => void;
  onClose: () => void;
}

interface JoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
}

export function TeamPublicProfile({ team, onBack, onClose }: TeamPublicProfileProps) {
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<JoinRequest | null>(null);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      checkMembershipStatus();
      checkExistingRequest();
    }
  }, [user, profile, team.id]);

  const checkMembershipStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('profile_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsAlreadyMember(!!data);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const checkExistingRequest = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('team_id', team.id)
        .eq('requesting_player_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setExistingRequest({
          ...data[0],
          status: data[0].status as 'pending' | 'approved' | 'rejected'
        });
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  const handleJoinRequest = async () => {
    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para solicitar entrada no time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .insert({
          team_id: team.id,
          requesting_player_id: profile.id,
          message: requestMessage.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Solicitação Enviada!",
        description: "Sua solicitação foi enviada para o administrador do time.",
      });

      // Refresh the request status
      checkExistingRequest();
      setRequestMessage("");
      onClose();
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'approved':
        return <Badge variant="default">Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return null;
    }
  };

  const canRequestJoin = !isAlreadyMember && (!existingRequest || existingRequest.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{team.name}</CardTitle>
              <CardDescription className="flex items-center gap-4">
                {team.state && team.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {team.city}, {team.state}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {team.member_count} membros
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Criado em {formatDate(team.created_at)}
                </span>
              </CardDescription>
            </div>
            <Badge variant="secondary">Time Público</Badge>
          </div>
        </CardHeader>

        {team.public_description && (
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold">Sobre o Time</h3>
              <p className="text-muted-foreground">{team.public_description}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status da Solicitação */}
      {existingRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {existingRequest.status === 'pending' && <Send className="h-5 w-5 text-orange-500" />}
              {existingRequest.status === 'approved' && <Check className="h-5 w-5 text-green-500" />}
              {existingRequest.status === 'rejected' && <X className="h-5 w-5 text-red-500" />}
              Sua Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Enviada em {formatDate(existingRequest.created_at)}
                </span>
                {getRequestStatusBadge(existingRequest.status)}
              </div>
              {existingRequest.message && (
                <div>
                  <p className="text-sm font-medium">Mensagem enviada:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {existingRequest.message}
                  </p>
                </div>
              )}
              {existingRequest.status === 'pending' && (
                <p className="text-sm text-orange-600">
                  Aguardando resposta do administrador do time.
                </p>
              )}
              {existingRequest.status === 'approved' && (
                <p className="text-sm text-green-600">
                  Parabéns! Você foi aceito no time. Recarregue a página para acessar as funcionalidades do time.
                </p>
              )}
              {existingRequest.status === 'rejected' && (
                <p className="text-sm text-red-600">
                  Sua solicitação foi rejeitada. Você pode enviar uma nova solicitação se desejar.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Já é membro */}
      {isAlreadyMember && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="font-semibold text-green-700">Você já faz parte deste time!</h3>
              <p className="text-sm text-muted-foreground">
                Recarregue a página para acessar todas as funcionalidades do time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Solicitação */}
      {canRequestJoin && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Entrada no Time</CardTitle>
            <CardDescription>
              Envie uma mensagem para o administrador do time explicando por que você gostaria de participar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Mensagem para o administrador (opcional)..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={handleJoinRequest} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Enviando..." : "Solicitar Entrada"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}