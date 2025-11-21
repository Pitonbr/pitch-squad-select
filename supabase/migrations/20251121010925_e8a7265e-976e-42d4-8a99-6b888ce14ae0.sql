-- Adicionar coluna para armazenar preferência de tema
ALTER TABLE public.profiles 
ADD COLUMN theme_preference text DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Criar índice para melhor performance
CREATE INDEX idx_profiles_theme_preference ON public.profiles(theme_preference);

-- Adicionar comentário
COMMENT ON COLUMN public.profiles.theme_preference IS 'User theme preference: light, dark, or system';