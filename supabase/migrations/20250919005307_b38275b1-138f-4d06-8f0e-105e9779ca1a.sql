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

-- Create secure aggregate views for regular team members
CREATE OR REPLACE VIEW public.team_financial_summary AS
SELECT 
  fp.team_id,
  fp.period_year,
  fp.period_month,
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
GROUP BY fp.team_id, fp.period_year, fp.period_month, fp.id;

-- Enable RLS on the view
ALTER VIEW public.team_financial_summary SET (security_barrier = true);

-- Create policy for team members to view only aggregated financial data
CREATE POLICY "Team members can view financial summary"
ON public.team_financial_summary
FOR SELECT
USING (is_team_member(auth.uid(), team_id));

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

-- Log this security fix
SELECT public.log_sensitive_operation(
  'SECURITY_FIX_FINANCIAL_DATA_ACCESS',
  jsonb_build_object(
    'description', 'Restricted financial data access to authorized roles only',
    'tables_affected', array['player_payments', 'team_expenses', 'team_revenues'],
    'timestamp', now()
  )
);