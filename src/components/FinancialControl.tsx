import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Plus,
  Trash2,
  Calculator,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  PieChart
} from "lucide-react";

interface Player {
  id: string;
  name: string;
  phone: string;
  isPaid: boolean;
  amount: number;
}

interface Expense {
  id: string;
  description: string;
  date: string;
  amount: number;
  paymentDate?: string;
}

interface FinancialPeriod {
  month: number;
  year: number;
  players: Player[];
  expenses: Expense[];
  monthlyFee: number;
  gameFee: number;
}

export function FinancialControl() {
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriod>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    players: [
      { id: "1", name: "Carlos Silva", phone: "(11) 99999-0001", isPaid: true, amount: 50 },
      { id: "2", name: "João Santos", phone: "(11) 99999-0002", isPaid: false, amount: 50 },
      { id: "3", name: "Pedro Costa", phone: "(11) 99999-0003", isPaid: true, amount: 50 },
    ],
    expenses: [
      { id: "1", description: "Aluguel do campo", date: "2024-01-05", amount: 200, paymentDate: "2024-01-05" },
      { id: "2", description: "Bolas de futebol", date: "2024-01-10", amount: 80 },
    ],
    monthlyFee: 50,
    gameFee: 20
  });

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    paymentDate: ""
  });

  // Calculations
  const totalIncome = currentPeriod.players.reduce((sum, player) => 
    sum + (player.isPaid ? player.amount : 0), 0
  );
  
  const expectedIncome = currentPeriod.players.reduce((sum, player) => 
    sum + player.amount, 0
  );
  
  const totalExpenses = currentPeriod.expenses.reduce((sum, expense) => 
    sum + expense.amount, 0
  );
  
  const paidExpenses = currentPeriod.expenses
    .filter(expense => expense.paymentDate)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const paymentPercentage = expectedIncome > 0 ? (totalIncome / expectedIncome) * 100 : 0;
  const balance = totalIncome - totalExpenses;
  const unpaidPlayers = currentPeriod.players.filter(p => !p.isPaid);

  const togglePlayerPayment = (playerId: string) => {
    setCurrentPeriod({
      ...currentPeriod,
      players: currentPeriod.players.map(player =>
        player.id === playerId ? { ...player, isPaid: !player.isPaid } : player
      )
    });
  };

  const addExpense = () => {
    if (newExpense.description.trim() && newExpense.amount) {
      const expense: Expense = {
        id: Date.now().toString(),
        description: newExpense.description.trim(),
        date: newExpense.date,
        amount: parseFloat(newExpense.amount),
        paymentDate: newExpense.paymentDate || undefined
      };
      
      setCurrentPeriod({
        ...currentPeriod,
        expenses: [...currentPeriod.expenses, expense]
      });
      
      setNewExpense({
        description: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        paymentDate: ""
      });
      setShowAddExpense(false);
    }
  };

  const deleteExpense = (expenseId: string) => {
    setCurrentPeriod({
      ...currentPeriod,
      expenses: currentPeriod.expenses.filter(e => e.id !== expenseId)
    });
  };

  const sendPaymentReminder = (player: Player) => {
    // Simulate sending reminder
    const message = `Olá ${player.name}! Lembrete: você tem um pagamento pendente de R$ ${player.amount.toFixed(2)}. Campo Squad.`;
    
    // This would integrate with SMS/WhatsApp API
    console.log(`Sending to ${player.phone}: ${message}`);
    
    // Show confirmation (you could add a toast notification)
    alert(`Lembrete enviado para ${player.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Controle Financeiro</h2>
          <p className="text-muted-foreground">
            Gerencie pagamentos e despesas do time - {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddExpense(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="field-gradient text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Recebido</p>
                <p className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hero-gradient text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Esperado</p>
                <p className="text-2xl font-bold">R$ {expectedIncome.toFixed(2)}</p>
              </div>
              <Calculator className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-destructive">R$ {totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className={balance >= 0 ? "border-success" : "border-warning"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? "text-success" : "text-warning"}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className={`p-2 rounded-full ${balance >= 0 ? "bg-success/10" : "bg-warning/10"}`}>
                {balance >= 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-warning" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Taxa de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Pagamentos recebidos</span>
              <Badge variant={paymentPercentage >= 80 ? "default" : paymentPercentage >= 60 ? "secondary" : "destructive"}>
                {paymentPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  paymentPercentage >= 80 ? "bg-success" : 
                  paymentPercentage >= 60 ? "bg-warning" : "bg-destructive"
                }`}
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {currentPeriod.players.filter(p => p.isPaid).length} de {currentPeriod.players.length} jogadores pagaram
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Payment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Status dos Pagamentos
            </CardTitle>
            <Badge variant="outline">
              {currentPeriod.players.length} jogadores
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentPeriod.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={player.isPaid}
                    onCheckedChange={() => togglePlayerPayment(player.id)}
                  />
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-medium">R$ {player.amount.toFixed(2)}</span>
                  <Badge variant={player.isPaid ? "default" : "destructive"}>
                    {player.isPaid ? "Pago" : "Pendente"}
                  </Badge>
                  {!player.isPaid && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendPaymentReminder(player)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Lembrar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Despesas do Mês
            </CardTitle>
            <Button onClick={() => setShowAddExpense(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddExpense && (
            <div className="mb-6 p-4 border rounded-lg space-y-4">
              <h4 className="font-semibold">Nova Despesa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Ex: Aluguel do campo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da Despesa</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Pagamento (opcional)</Label>
                  <Input
                    type="date"
                    value={newExpense.paymentDate}
                    onChange={(e) => setNewExpense({...newExpense, paymentDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addExpense}>Adicionar Despesa</Button>
                <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {currentPeriod.expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Despesa: {new Date(expense.date).toLocaleDateString('pt-BR')}
                        {expense.paymentDate && (
                          <span> • Pago: {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-medium text-destructive">R$ {expense.amount.toFixed(2)}</span>
                  <Badge variant={expense.paymentDate ? "default" : "secondary"}>
                    {expense.paymentDate ? "Pago" : "Pendente"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            
            {currentPeriod.expenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma despesa registrada neste período.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unpaid Players Alert */}
      {unpaidPlayers.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Atenção: {unpaidPlayers.length} Pagamento(s) Pendente(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unpaidPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-warning/5 rounded">
                  <span>{player.name} - R$ {player.amount.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendPaymentReminder(player)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Enviar Lembrete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}