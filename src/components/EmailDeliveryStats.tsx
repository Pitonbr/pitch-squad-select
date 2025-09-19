import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailStats {
  email_domain: string;
  total_attempts: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
}

export const EmailDeliveryStats = () => {
  const [stats, setStats] = useState<EmailStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(7);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      console.log(`📊 Fetching email delivery stats for last ${daysBack} days...`);

      const { data, error } = await supabase
        .rpc('get_email_delivery_stats', { _days_back: daysBack });

      if (error) {
        console.error("❌ Error fetching email stats:", error);
        toast({
          title: "Erro ao carregar estatísticas",
          description: "Não foi possível carregar as estatísticas de email.",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Email stats loaded:", data);
      setStats(data || []);

    } catch (error) {
      console.error("❌ Exception fetching email stats:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as estatísticas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [daysBack]);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const totalAttempts = stats.reduce((sum, stat) => sum + stat.total_attempts, 0);
  const totalSuccessful = stats.reduce((sum, stat) => sum + stat.successful_deliveries, 0);
  const overallSuccessRate = totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Estatísticas de Email
            </CardTitle>
            <CardDescription>
              Entregabilidade de emails por domínio (últimos {daysBack} dias)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={1}>1 dia</option>
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando estatísticas...</span>
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma estatística disponível para o período selecionado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalAttempts}</div>
                <div className="text-sm text-muted-foreground">Total de Tentativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalSuccessful}</div>
                <div className="text-sm text-muted-foreground">Emails Enviados</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSuccessRateColor(overallSuccessRate)}`}>
                  {overallSuccessRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso Geral</div>
              </div>
            </div>

            {/* Domain Stats */}
            <div className="space-y-3">
              <h4 className="font-medium">Estatísticas por Domínio</h4>
              {stats.map((stat) => (
                <div 
                  key={stat.email_domain}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSuccessRateIcon(stat.success_rate)}
                    <div>
                      <div className="font-medium">@{stat.email_domain}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.total_attempts} tentativas • {stat.successful_deliveries} enviados
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={stat.success_rate >= 90 ? "default" : stat.success_rate >= 70 ? "secondary" : "destructive"}
                    >
                      {stat.success_rate.toFixed(1)}%
                    </Badge>
                    {stat.failed_deliveries > 0 && (
                      <Badge variant="outline" className="text-red-600">
                        {stat.failed_deliveries} falhas
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Domain-specific recommendations */}
            {stats.some(stat => stat.email_domain === 'gmail.com' && stat.success_rate < 90) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica para Gmail:</strong> Taxa de sucesso baixa detectada. 
                  Considere configurar SPF, DKIM e DMARC no seu domínio para melhorar a entregabilidade.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};