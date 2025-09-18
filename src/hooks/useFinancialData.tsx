import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTeams } from './useTeams';
import { toast } from '@/hooks/use-toast';

interface FinancialPeriod {
  id: string;
  team_id: string;
  period_year: number;
  period_month: number;
  monthly_fee: number;
  game_fee: number;
  created_at: string;
  updated_at: string;
}

interface PlayerPayment {
  id: string;
  financial_period_id: string;
  player_id: string;
  payment_type: 'monthly_fee' | 'game_fee';
  amount: number;
  paid: boolean;
  payment_date: string | null;
  player?: {
    name: string;
    nickname: string;
  };
}

interface TeamExpense {
  id: string;
  financial_period_id: string;
  description: string;
  amount: number;
  expense_date: string;
  paid: boolean;
  payment_date: string | null;
  created_by: string;
}

interface TeamRevenue {
  id: string;
  financial_period_id: string;
  description: string;
  amount: number;
  revenue_date: string;
  received: boolean;
  received_date: string | null;
  created_by: string;
}

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
}

export const useFinancialData = () => {
  const { user } = useAuth();
  const { activeTeam, isTeamAdmin } = useTeams();
  const [loading, setLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriod | null>(null);
  const [playerPayments, setPlayerPayments] = useState<PlayerPayment[]>([]);
  const [teamExpenses, setTeamExpenses] = useState<TeamExpense[]>([]);
  const [teamRevenues, setTeamRevenues] = useState<TeamRevenue[]>([]);
  const [isFinancialAdmin, setIsFinancialAdmin] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Check financial admin permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !activeTeam) {
        setIsFinancialAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_financial_admin_access', {
          _user_id: user.id,
          _team_id: activeTeam.id
        });

        if (error) throw error;
        setIsFinancialAdmin(data || false);
      } catch (error) {
        console.error('Error checking financial permissions:', error);
        setIsFinancialAdmin(isTeamAdmin(activeTeam.id));
      }
    };

    checkPermissions();
  }, [user, activeTeam, isTeamAdmin]);

  // Load financial data for current period
  useEffect(() => {
    if (activeTeam && selectedYear && selectedMonth) {
      loadFinancialData();
    }
  }, [activeTeam, selectedYear, selectedMonth]);

  const loadFinancialData = async () => {
    if (!activeTeam) return;

    setLoading(true);
    try {
      // Get or create financial period
      let { data: period, error: periodError } = await supabase
        .from('financial_periods')
        .select('*')
        .eq('team_id', activeTeam.id)
        .eq('period_year', selectedYear)
        .eq('period_month', selectedMonth)
        .maybeSingle();

      if (periodError) throw periodError;

      if (!period && isFinancialAdmin) {
        // Create new period if admin
        const { data: newPeriod, error: createError } = await supabase
          .from('financial_periods')
          .insert({
            team_id: activeTeam.id,
            period_year: selectedYear,
            period_month: selectedMonth
          })
          .select()
          .single();

        if (createError) throw createError;
        period = newPeriod;
      }

      setCurrentPeriod(period);

      if (period) {
        await Promise.all([
          loadPlayerPayments(period.id),
          loadTeamExpenses(period.id),
          loadTeamRevenues(period.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados financeiros.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerPayments = async (periodId: string) => {
    try {
      const { data, error } = await supabase
        .from('player_payments')
        .select(`
          *,
          players!inner (
            name,
            nickname
          )
        `)
        .eq('financial_period_id', periodId);

      if (error) throw error;
      
      const formattedPayments = data?.map(payment => ({
        ...payment,
        payment_type: payment.payment_type as 'monthly_fee' | 'game_fee',
        player: payment.players
      })) || [];
      
      setPlayerPayments(formattedPayments);
    } catch (error) {
      console.error('Error loading player payments:', error);
    }
  };

  const loadTeamExpenses = async (periodId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_expenses')
        .select('*')
        .eq('financial_period_id', periodId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setTeamExpenses(data || []);
    } catch (error) {
      console.error('Error loading team expenses:', error);
    }
  };

  const loadTeamRevenues = async (periodId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_revenues')
        .select('*')
        .eq('financial_period_id', periodId)
        .order('revenue_date', { ascending: false });

      if (error) throw error;
      setTeamRevenues(data || []);
    } catch (error) {
      console.error('Error loading team revenues:', error);
    }
  };

  const generatePlayerPayments = async () => {
    if (!currentPeriod || !isFinancialAdmin || !activeTeam) return;

    try {
      // Get all team players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', activeTeam.id);

      if (playersError) throw playersError;

      // Create payment records for each player
      const paymentInserts = players.flatMap(player => [
        {
          financial_period_id: currentPeriod.id,
          player_id: player.id,
          payment_type: 'monthly_fee',
          amount: currentPeriod.monthly_fee
        },
        {
          financial_period_id: currentPeriod.id,
          player_id: player.id,
          payment_type: 'game_fee',
          amount: currentPeriod.game_fee
        }
      ]);

      const { error: insertError } = await supabase
        .from('player_payments')
        .insert(paymentInserts);

      if (insertError) throw insertError;

      await loadPlayerPayments(currentPeriod.id);
      toast({
        title: 'Sucesso',
        description: 'Pagamentos dos jogadores gerados com sucesso!'
      });
    } catch (error) {
      console.error('Error generating player payments:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar pagamentos dos jogadores.',
        variant: 'destructive'
      });
    }
  };

  const togglePlayerPayment = async (paymentId: string, paid: boolean) => {
    if (!isFinancialAdmin) return;

    try {
      const { error } = await supabase
        .from('player_payments')
        .update({ 
          paid,
          payment_date: paid ? new Date().toISOString() : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      setPlayerPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, paid, payment_date: paid ? new Date().toISOString() : null }
            : payment
        )
      );

      toast({
        title: 'Sucesso',
        description: `Pagamento ${paid ? 'confirmado' : 'cancelado'} com sucesso!`
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar pagamento.',
        variant: 'destructive'
      });
    }
  };

  const addExpense = async (description: string, amount: number, expenseDate: string) => {
    if (!currentPeriod || !isFinancialAdmin || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('team_expenses')
        .insert({
          financial_period_id: currentPeriod.id,
          description,
          amount,
          expense_date: expenseDate,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      setTeamExpenses(prev => [data, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Despesa adicionada com sucesso!'
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar despesa.',
        variant: 'destructive'
      });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!isFinancialAdmin) return;

    try {
      const { error } = await supabase
        .from('team_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      setTeamExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      toast({
        title: 'Sucesso',
        description: 'Despesa removida com sucesso!'
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover despesa.',
        variant: 'destructive'
      });
    }
  };

  const addRevenue = async (description: string, amount: number, revenueDate: string) => {
    if (!currentPeriod || !isFinancialAdmin || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('team_revenues')
        .insert({
          financial_period_id: currentPeriod.id,
          description,
          amount,
          revenue_date: revenueDate,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      setTeamRevenues(prev => [data, ...prev]);
      toast({
        title: 'Sucesso',
        description: 'Receita adicionada com sucesso!'
      });
    } catch (error) {
      console.error('Error adding revenue:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar receita.',
        variant: 'destructive'
      });
    }
  };

  const deleteRevenue = async (revenueId: string) => {
    if (!isFinancialAdmin) return;

    try {
      const { error } = await supabase
        .from('team_revenues')
        .delete()
        .eq('id', revenueId);

      if (error) throw error;

      setTeamRevenues(prev => prev.filter(revenue => revenue.id !== revenueId));
      toast({
        title: 'Sucesso',
        description: 'Receita removida com sucesso!'
      });
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover receita.',
        variant: 'destructive'
      });
    }
  };

  const toggleRevenueReceived = async (revenueId: string, received: boolean) => {
    if (!isFinancialAdmin) return;

    try {
      const { error } = await supabase
        .from('team_revenues')
        .update({ 
          received,
          received_date: received ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', revenueId);

      if (error) throw error;

      setTeamRevenues(prev => 
        prev.map(revenue => 
          revenue.id === revenueId 
            ? { ...revenue, received, received_date: received ? new Date().toISOString().split('T')[0] : null }
            : revenue
        )
      );

      toast({
        title: 'Sucesso',
        description: `Receita ${received ? 'confirmada como recebida' : 'marcada como pendente'}!`
      });
    } catch (error) {
      console.error('Error updating revenue:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar receita.',
        variant: 'destructive'
      });
    }
  };

  const sendPaymentReminder = async (paymentId: string) => {
    if (!isFinancialAdmin || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('payment_reminders')
        .insert({
          player_payment_id: paymentId,
          sent_by: profile.id,
          message: 'Lembrete de pagamento enviado'
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lembrete de pagamento enviado!'
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar lembrete.',
        variant: 'destructive'
      });
    }
  };

  // Calculate financial summary
  const getFinancialSummary = (): FinancialSummary => {
    const playerIncome = playerPayments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
    const extraRevenue = teamRevenues.filter(r => r.received).reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = playerIncome + extraRevenue;
    const expectedIncome = playerPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = teamExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    const paidPlayers = new Set(playerPayments.filter(p => p.paid).map(p => p.player_id)).size;
    const totalPlayers = new Set(playerPayments.map(p => p.player_id)).size;
    const paymentPercentage = totalPlayers > 0 ? (paidPlayers / totalPlayers) * 100 : 0;

    return {
      totalIncome,
      playerIncome,
      extraRevenue,
      expectedIncome,
      totalExpenses,
      balance,
      paymentPercentage,
      paidPlayers,
      totalPlayers
    };
  };

  return {
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
    loadFinancialData,
    generatePlayerPayments,
    togglePlayerPayment,
    addExpense,
    deleteExpense,
    addRevenue,
    deleteRevenue,
    toggleRevenueReceived,
    sendPaymentReminder,
    getFinancialSummary
  };
};