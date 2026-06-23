import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, User, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  profile: {
    display_name: string | null;
  } | null;
}

interface AuditLogsProps {
  teamId: string;
}

export function AuditLogs({ teamId }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && teamId) {
      fetchAuditLogs();
    }
  }, [user, teamId]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles(display_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Erro ao carregar logs",
        description: "Não foi possível carregar o histórico de atividades.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <User className="h-3 w-3" />;
      case 'UPDATE': return <Activity className="h-3 w-3" />;
      case 'DELETE': return <Shield className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatResourceType = (resourceType: string) => {
    const typeMap: { [key: string]: string } = {
      'teams': 'Time',
      'players': 'Jogador', 
      'team_members': 'Membro do Time',
      'games': 'Jogo',
      'tournaments': 'Torneio'
    };
    return typeMap[resourceType] || resourceType;
  };

  const getChangeDescription = (log: AuditLog) => {
    const resourceType = formatResourceType(log.resource_type);
    
    switch (log.action) {
      case 'INSERT':
        return `Criou um novo ${resourceType.toLowerCase()}`;
      case 'UPDATE':
        return `Atualizou ${resourceType.toLowerCase()}`;
      case 'DELETE':
        return `Removeu ${resourceType.toLowerCase()}`;
      default:
        return `${log.action} em ${resourceType.toLowerCase()}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium">
                        {log.profile?.display_name || 'Usuário desconhecido'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getChangeDescription(log)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}