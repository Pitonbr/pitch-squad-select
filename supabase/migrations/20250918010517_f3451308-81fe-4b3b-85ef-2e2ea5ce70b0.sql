-- Add treasurer functionality to teams table
ALTER TABLE public.teams 
ADD COLUMN treasurer_id uuid REFERENCES public.profiles(id);

-- Create financial periods table
CREATE TABLE public.financial_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  monthly_fee decimal(10,2) DEFAULT 50.00,
  game_fee decimal(10,2) DEFAULT 10.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, period_year, period_month)
);

-- Create player payments table
CREATE TABLE public.player_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financial_period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('monthly_fee', 'game_fee')),
  amount decimal(10,2) NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(financial_period_id, player_id, payment_type)
);

-- Create team expenses table
CREATE TABLE public.team_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financial_period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  paid boolean NOT NULL DEFAULT false,
  payment_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payment reminders table
CREATE TABLE public.payment_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_payment_id uuid NOT NULL REFERENCES public.player_payments(id) ON DELETE CASCADE,
  sent_by uuid NOT NULL REFERENCES public.profiles(id),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  message text
);

-- Enable RLS on all new tables
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is team treasurer
CREATE OR REPLACE FUNCTION public.is_team_treasurer(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    JOIN public.profiles p ON t.treasurer_id = p.id
    WHERE t.id = _team_id AND p.user_id = _user_id
  )
$$;

-- Create function to check if user has financial admin access (admin or treasurer)
CREATE OR REPLACE FUNCTION public.has_financial_admin_access(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    is_team_admin(_user_id, _team_id) OR 
    is_team_treasurer(_user_id, _team_id)
  )
$$;

-- RLS Policies for financial_periods
CREATE POLICY "Team members can view financial periods" 
ON public.financial_periods 
FOR SELECT 
USING (is_team_member(auth.uid(), team_id));

CREATE POLICY "Financial admins can manage financial periods" 
ON public.financial_periods 
FOR ALL 
USING (has_financial_admin_access(auth.uid(), team_id))
WITH CHECK (has_financial_admin_access(auth.uid(), team_id));

-- RLS Policies for player_payments
CREATE POLICY "Team members can view aggregated payment data" 
ON public.player_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND is_team_member(auth.uid(), fp.team_id)
));

CREATE POLICY "Financial admins can manage player payments" 
ON public.player_payments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
));

-- RLS Policies for team_expenses
CREATE POLICY "Team members can view team expenses" 
ON public.team_expenses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND is_team_member(auth.uid(), fp.team_id)
));

CREATE POLICY "Financial admins can manage team expenses" 
ON public.team_expenses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
));

-- RLS Policies for payment_reminders
CREATE POLICY "Team members can view payment reminders" 
ON public.payment_reminders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.player_payments pp
  JOIN public.financial_periods fp ON fp.id = pp.financial_period_id
  WHERE pp.id = payment_reminders.player_payment_id 
  AND is_team_member(auth.uid(), fp.team_id)
));

CREATE POLICY "Financial admins can manage payment reminders" 
ON public.payment_reminders 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.player_payments pp
  JOIN public.financial_periods fp ON fp.id = pp.financial_period_id
  WHERE pp.id = payment_reminders.player_payment_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.player_payments pp
  JOIN public.financial_periods fp ON fp.id = pp.financial_period_id
  WHERE pp.id = payment_reminders.player_payment_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_financial_periods_updated_at
BEFORE UPDATE ON public.financial_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_payments_updated_at
BEFORE UPDATE ON public.player_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_expenses_updated_at
BEFORE UPDATE ON public.team_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();