-- Create team_revenues table for additional income sources
CREATE TABLE public.team_revenues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financial_period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  revenue_date date NOT NULL DEFAULT CURRENT_DATE,
  received boolean NOT NULL DEFAULT false,
  received_date date,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_revenues ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_revenues
CREATE POLICY "Financial admins can manage team revenues" 
ON public.team_revenues 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = team_revenues.financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = team_revenues.financial_period_id 
  AND has_financial_admin_access(auth.uid(), fp.team_id)
));

CREATE POLICY "Team members can view team revenues" 
ON public.team_revenues 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_periods fp 
  WHERE fp.id = team_revenues.financial_period_id 
  AND is_team_member(auth.uid(), fp.team_id)
));

-- Add trigger for updated_at
CREATE TRIGGER update_team_revenues_updated_at
BEFORE UPDATE ON public.team_revenues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();