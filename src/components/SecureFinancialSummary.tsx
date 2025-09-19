import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BarChart3,
  Shield,
  Info
} from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';

interface FinancialSummary {
  totalIncome: number;
  playerIncome: number;
  extraRevenue: number;
  expectedIncome: number;
  totalExpenses: number;
  balance: number;
  paymentPercentage: number;
  paidPlayers: number;
  totalPlayers: number;
  totalPlayersWithPayments?: number;
  playersPaidCount?: number;
  totalCollected?: number;
  totalExpected?: number;
  expenseCount?: number;
  expensesPaid?: number;
  revenueCount?: number;
  revenueReceived?: number;
  totalExpectedRevenue?: number;
  currentBalance?: number;
}

export const SecureFinancialSummary: React.FC = () => {
  const { getSecureFinancialSummary, selectedYear, selectedMonth, loading } = useFinancialData();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      setLoadingSummary(true);
      try {
        const data = await getSecureFinancialSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error loading secure financial summary:', error);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadSummary();
  }, [selectedYear, selectedMonth, getSecureFinancialSummary]);

  if (loading || loadingSummary) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado financeiro encontrado para o período selecionado.
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Visualização Segura:</strong> Por questões de privacidade, apenas dados agregados são exibidos para membros do time. 
          Administradores financeiros têm acesso a informações detalhadas.
        </AlertDescription>
      </Alert>

      {/* Main Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Coletada</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.playerIncome + summary.extraRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Jogadores: {formatCurrency(summary.playerIncome)} + 
              Outras: {formatCurrency(summary.extraRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.expenseCount || 0} despesa(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jogadores Pagos</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.paidPlayers}/{summary.totalPlayers}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.paymentPercentage.toFixed(1)}% concluído
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pagamentos Recebidos</span>
              <Badge variant={summary.paymentPercentage >= 80 ? "default" : "secondary"}>
                {summary.paymentPercentage.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={summary.paymentPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pago: {formatCurrency(summary.playerIncome)}</span>
              <span>Esperado: {formatCurrency(summary.expectedIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo de Receitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Mensalidades/Jogos:</span>
              <span className="font-medium">{formatCurrency(summary.playerIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Receitas Extras:</span>
              <span className="font-medium">{formatCurrency(summary.extraRevenue)}</span>
            </div>
            {summary.revenueCount !== undefined && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total de receitas extras:</span>
                <span>{summary.revenueCount}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Pago:</span>
              <span className="font-medium">{formatCurrency(summary.totalExpenses)}</span>
            </div>
            {summary.expenseCount !== undefined && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Número de despesas:</span>
                <span>{summary.expenseCount}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};