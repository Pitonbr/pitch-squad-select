-- Atualizar constraint para incluir novos temas de acessibilidade
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_theme_preference_check 
CHECK (theme_preference IN ('light', 'dark', 'system', 'high-contrast', 'colorblind'));

-- Atualizar comentário
COMMENT ON COLUMN public.profiles.theme_preference IS 'User theme preference: light, dark, system, high-contrast, or colorblind';