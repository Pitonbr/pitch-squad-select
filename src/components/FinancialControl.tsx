import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Plus,
  Trash2,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TreasurerSelector } from './TreasurerSelector';
import { useTeams } from '@/hooks/useTeams';
import { SecureFinancialSummary } from './SecureFinancialSummary';

export const FinancialControl: React.FC = () => {
  const { activeTeam } = useTeams();
  const {
    loading,
    currentPeriod,
    playerPayments,
    teamExpenses,
    teamRevenues,
    isFinancialAdmin,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    generatePlayerPayments,
    togglePlayerPayment,
    addExpense,
    deleteExpense,
    addRevenue,
    deleteRevenue,
    toggleRevenueReceived,
    sendPaymentReminder,
    sendBatchPaymentReminders,
    getFinancialSummary
  } = useFinancialData();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [newRevenue, setNewRevenue] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Selecione um time para ver os dados financeiros
          </h3>
        </div>
      </div>
    );
  }

  // Show secure view for regular team members
  if (!isFinancialAdmin) {
    return (
      <div className="space-y-6">
        {/* Header with period selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Resumo Financeiro
            </h2>
            <p className="text-muted-foreground">
              Visão geral das finanças do time - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (selectedMonth === 1) {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (selectedMonth === 12) {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Secure Financial Summary */}
        <SecureFinancialSummary />
      </div>
    );
  }

  const summary = getFinancialSummary();

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    addExpense(
      newExpense.description,
      parseFloat(newExpense.amount),
      newExpense.date
    );
    
    setNewExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowAddExpense(false);
  };

  const handleAddRevenue = () => {
    if (!newRevenue.description || !newRevenue.amount) return;
    
    addRevenue(
      newRevenue.description,
      parseFloat(newRevenue.amount),
      newRevenue.date
    );
    
    setNewRevenue({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowAddRevenue(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getMonthName = () => {
    return format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Treasurer Configuration (Admin only) */}
      <TreasurerSelector />

      {/* Period Navigation and View Mode */}
      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-primary" />
              Período Financeiro
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: 'monthly' | 'annual') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'monthly' && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {getMonthName()}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {viewMode === 'annual' && (
            <div className="text-center">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32 mx-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              R$ {summary.totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-white/60">
              Jogadores: R$ {summary.playerIncome.toFixed(2)} | Extras: R$ {summary.extraRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Receita Esperada</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {summary.expectedIncome.toFixed(2)}
            </div>
            <p className="text-xs text-white/60">
              {summary.totalPlayers} jogador(es)
            </p>
          </CardContent>
        </Card>

        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              R$ {summary.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-white/60">
              {teamExpenses.filter(e => e.paid).length} despesa(s) paga(s)
            </p>
          </CardContent>
        </Card>

        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Saldo</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {summary.balance.toFixed(2)}
            </div>
            <p className="text-xs text-white/60">
              Receita - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progresso dos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Jogadores que pagaram</span>
              <span>{Math.round(summary.paymentPercentage)}%</span>
            </div>
            <Progress value={summary.paymentPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{summary.paidPlayers} de {summary.totalPlayers} jogadores</span>
              <span>R$ {summary.totalIncome.toFixed(2)} arrecadado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Payment Status */}
      {isFinancialAdmin ? (
        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-primary" />
              Gestão de Pagamentos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {playerPayments.length} pagamentos
              </Badge>
              {playerPayments.some(p => p.status !== 'paid') && (
                <Button
                  type="button"
                  onClick={sendBatchPaymentReminders}
                  size="sm"
                  variant="outline"
                  disabled={loading}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Cobrar todos
                </Button>
              )}
              {currentPeriod && playerPayments.length === 0 && (
                <Button
                  type="button"
                  onClick={generatePlayerPayments}
                  size="sm"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Gerar Pagamentos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : playerPayments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-white/70">
                  {currentPeriod ? 'Clique em "Gerar Pagamentos" para começar' : 'Nenhum período financeiro encontrado'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {playerPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-primary/30 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-white">{payment.player?.name}</p>
                        <p className="text-sm text-white/60 capitalize">
                          {payment.payment_type === 'monthly_fee' ? 'Mensalidade' : 'Taxa do jogo'}
                          {payment.due_date && payment.status !== 'paid' && (
                            <> · vence {format(new Date(`${payment.due_date}T00:00:00`), 'dd/MM')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                      <Badge variant="outline">
                        R$ {payment.amount.toFixed(2)}
                      </Badge>
                      <Switch
                        checked={payment.paid}
                        onCheckedChange={(checked) => togglePlayerPayment(payment.id, checked)}
                        disabled={loading}
                      />
                      {payment.status !== 'paid' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => sendPaymentReminder(payment.id)}
                          disabled={loading}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Regular players see only summary
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summary.paidPlayers}
                </div>
                <p className="text-sm text-green-600">Jogadores em dia</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {summary.totalPlayers - summary.paidPlayers}
                </div>
                <p className="text-sm text-red-600">Jogadores pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Management */}
      {isFinancialAdmin ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Controle de Despesas
            </CardTitle>
            <Button
              onClick={() => setShowAddExpense(true)}
              size="sm"
              className="flex items-center gap-1"
              disabled={!currentPeriod}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Expense Form */}
            {showAddExpense && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Aluguel do campo"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddExpense}
                      size="sm"
                      disabled={!newExpense.description || !newExpense.amount || loading}
                    >
                      Adicionar
                    </Button>
                    <Button
                      onClick={() => setShowAddExpense(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Expense List */}
            {loading ? (
              <div className="space-y-3">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : teamExpenses.length === 0 ? (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma despesa registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{expense.description}</p>
                        {expense.paid && (
                          <Badge variant="outline" className="text-xs">
                            Pago
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {expense.payment_date && (
                          <span className="text-green-600">
                            Pago em {format(new Date(expense.payment_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={expense.paid ? "default" : "secondary"}>
                        R$ {expense.amount.toFixed(2)}
                      </Badge>
                      <Button
                        onClick={() => deleteExpense(expense.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Regular players see only expense summary
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Resumo de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                R$ {summary.totalExpenses.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de despesas do período
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Management */}
      {isFinancialAdmin ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Controle de Receitas
            </CardTitle>
            <Button
              onClick={() => setShowAddRevenue(true)}
              size="sm"
              className="flex items-center gap-1"
              disabled={!currentPeriod}
            >
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Revenue Form */}
            {showAddRevenue && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="revenue-description">Descrição</Label>
                    <Input
                      id="revenue-description"
                      placeholder="Ex: Patrocínio Empresa X, Venda de camisetas"
                      value={newRevenue.description}
                      onChange={(e) => setNewRevenue(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue-amount">Valor</Label>
                    <Input
                      id="revenue-amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={newRevenue.amount}
                      onChange={(e) => setNewRevenue(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue-date">Data</Label>
                    <Input
                      id="revenue-date"
                      type="date"
                      value={newRevenue.date}
                      onChange={(e) => setNewRevenue(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddRevenue}
                      size="sm"
                      disabled={!newRevenue.description || !newRevenue.amount || loading}
                    >
                      Adicionar
                    </Button>
                    <Button
                      onClick={() => setShowAddRevenue(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue List */}
            {loading ? (
              <div className="space-y-3">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : teamRevenues.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma receita extra registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamRevenues.map((revenue) => (
                  <div key={revenue.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{revenue.description}</p>
                        {revenue.received && (
                          <Badge variant="outline" className="text-xs">
                            Recebido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(revenue.revenue_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {revenue.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={revenue.received}
                        onCheckedChange={(checked) => toggleRevenueReceived(revenue.id, checked)}
                        disabled={loading}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRevenue(revenue.id)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Regular players see only revenue summary
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo de Receitas Extras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ {summary.extraRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de receitas extras do período
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts and Notifications */}
      {summary.totalPlayers - summary.paidPlayers > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {summary.totalPlayers - summary.paidPlayers} jogador(es) ainda não pagaram a mensalidade. 
            {isFinancialAdmin && ' Considere enviar lembretes de pagamento.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};