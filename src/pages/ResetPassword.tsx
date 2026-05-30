import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast, useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/soccer-squad-logo.jpeg";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      try {
        // Check URL parameters (both query string and hash)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Supabase can send tokens in different ways
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        
        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session with the tokens from URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            setHasValidToken(true);
            return;
          }
        }
        
        // Fallback: check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasValidToken(true);
        } else {
          toast({
            title: "Link inválido ou expirado",
            description: "Por favor, solicite um novo link de recuperação.",
            variant: "destructive"
          });
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (error) {
        console.error('Error handling password recovery:', error);
        toast({
          title: "Erro ao processar link",
          description: "Por favor, solicite um novo link de recuperação.",
          variant: "destructive"
        });
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    handlePasswordRecovery();
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.password,
      });

      if (error) throw error;

      // Log password reset in audit log
      try {
        await supabase.rpc('create_audit_log', {
          _action: 'PASSWORD_RESET',
          _resource_type: 'auth',
          _old_values: null,
          _new_values: { timestamp: new Date().toISOString() }
        });
      } catch (auditError) {
        console.error('Error logging password reset:', auditError);
      }

      // Sign out to force user to log in with new password
      await supabase.auth.signOut();

      toast({
        title: "Senha redefinida!",
        description: "Faça login com sua nova senha para validar a alteração.",
      });

      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasValidToken) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `linear-gradient(rgba(26, 46, 61, 0.85), rgba(10, 20, 30, 0.9)), url(${soccerFieldHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <Card variant="dark" className="w-full max-w-md backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Verificando link...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 46, 61, 0.85), rgba(10, 20, 30, 0.9)), url(${soccerFieldHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full max-w-md space-y-8">
        <Helmet>
          <title>Redefinir Senha — Soccer Squad</title>
          <meta name="description" content="Defina uma nova senha para sua conta Soccer Squad e continue gerenciando suas partidas de futebol." />
          <link rel="canonical" href="https://soccersquad.com.br/reset-password" />
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Soccer Squad" 
            className="h-24 w-24 mx-auto rounded-full object-cover shadow-[0_0_30px_rgba(63,184,175,0.6)] ring-4 ring-primary/30"
          />
          <h1 className="text-4xl font-bold text-white text-glow-cyan">
            Soccer Squad — Redefinir Senha
          </h1>
        </div>

        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Redefinir Senha</CardTitle>
            <CardDescription className="text-white/70">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={passwords.password}
                    onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                    className="pl-10 pr-10 bg-black/30 border-primary/50 text-white placeholder:text-white/50"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwords.password.length > 0 && passwords.password.length < 8 && (
                  <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 bg-black/30 border-primary/50 text-white placeholder:text-white/50"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwords.confirmPassword.length > 0 && 
                 passwords.password !== passwords.confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
                {passwords.confirmPassword.length > 0 && 
                 passwords.password === passwords.confirmPassword && (
                  <p className="text-xs text-accent">✓ As senhas coincidem</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-accent text-white" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-white hover:bg-white/10"
                onClick={() => navigate('/auth')}
                disabled={loading}
              >
                Voltar para Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
