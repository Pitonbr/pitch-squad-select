-- CRITICAL SECURITY FIX: Restrict financial data access to authorized roles only

-- Remove overly permissive policies for financial tables
DROP POLICY IF EXISTS "Team members can view aggregated payment data" ON public.player_payments;
DROP POLICY IF EXISTS "Team members can view team expenses" ON public.team_expenses;  
DROP POLICY IF EXISTS "Team members can view team revenues" ON public.team_revenues;

-- Create more secure policies that restrict financial data to financial admins only
CREATE POLICY "Only financial admins can view player payments"
ON public.player_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM financial_periods fp
    WHERE fp.id = player_payments.financial_period_id 
      AND has_financial_admin_access(auth.uid(), fp.team_id)
  )
);

CREATE POLICY "Only financial admins can view team expenses"
ON public.team_expenses
FOR SELECT  
USING (
  EXISTS (
    SELECT 1 FROM financial_periods fp
    WHERE fp.id = team_expenses.financial_period_id 
      AND has_financial_admin_access(auth.uid(), fp.team_id)
  )
);

CREATE POLICY "Only financial admins can view team revenues"
ON public.team_revenues
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM financial_periods fp  
    WHERE fp.id = team_revenues.financial_period_id 
      AND has_financial_admin_access(auth.uid(), fp.team_id)
  )
);

-- Create secure function to get financial summary for team members
CREATE OR REPLACE FUNCTION public.get_team_financial_summary(_team_id uuid, _period_year integer, _period_month integer)
RETURNS TABLE(
  total_players_with_payments bigint,
  players_paid_count bigint,
  total_collected numeric,
  total_expected numeric,
  expense_count bigint,
  expenses_paid numeric,
  total_expenses numeric,
  revenue_count bigint,
  revenue_received numeric,
  total_expected_revenue numeric,
  current_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a team member
  IF NOT is_team_member(auth.uid(), _team_id) THEN
    RAISE EXCEPTION 'Access denied: not a team member';
  END IF;

  RETURN QUERY
  SELECT 
    -- Aggregated payment data (no individual details)
    COUNT(pp.id) as total_players_with_payments,
    COUNT(CASE WHEN pp.paid = true THEN 1 END) as players_paid_count,
    SUM(CASE WHEN pp.paid = true THEN pp.amount ELSE 0 END) as total_collected,
    SUM(pp.amount) as total_expected,
    -- Aggregated expense data (no individual details)
    COUNT(te.id) as expense_count,
    SUM(CASE WHEN te.paid = true THEN te.amount ELSE 0 END) as expenses_paid,
    SUM(te.amount) as total_expenses,
    -- Aggregated revenue data (no individual details) 
    COUNT(tr.id) as revenue_count,
    SUM(CASE WHEN tr.received = true THEN tr.amount ELSE 0 END) as revenue_received,
    SUM(tr.amount) as total_expected_revenue,
    -- Overall balance
    (
      SUM(CASE WHEN pp.paid = true THEN pp.amount ELSE 0 END) + 
      SUM(CASE WHEN tr.received = true THEN tr.amount ELSE 0 END) -
      SUM(CASE WHEN te.paid = true THEN te.amount ELSE 0 END)
    ) as current_balance
  FROM financial_periods fp
  LEFT JOIN player_payments pp ON fp.id = pp.financial_period_id
  LEFT JOIN team_expenses te ON fp.id = te.financial_period_id  
  LEFT JOIN team_revenues tr ON fp.id = tr.financial_period_id
  WHERE fp.team_id = _team_id 
    AND fp.period_year = _period_year 
    AND fp.period_month = _period_month;
END;
$$;

-- Create function to check if user can view individual player payment status
CREATE OR REPLACE FUNCTION public.can_view_player_payment_status(_team_id uuid, _requesting_user_id uuid, _target_player_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _requesting_profile_id uuid;
  _target_profile_id uuid;
BEGIN
  -- Financial admins can view all payment statuses
  IF has_financial_admin_access(_requesting_user_id, _team_id) THEN
    RETURN true;
  END IF;
  
  -- Get profile IDs
  SELECT id INTO _requesting_profile_id FROM profiles WHERE user_id = _requesting_user_id;
  SELECT profile_id INTO _target_profile_id FROM players WHERE id = _target_player_id;
  
  -- Users can only view their own payment status
  RETURN (_requesting_profile_id = _target_profile_id);
END;
$$;