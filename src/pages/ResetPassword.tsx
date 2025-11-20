import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import logoImage from "@/assets/soccer-squad-logo.jpeg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkToken = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setHasValidToken(true);
      } else {
        toast({
          title: "Link inválido ou expirado",
          description: "Por favor, solicite um novo link de recuperação de senha.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    checkToken();
  }, [navigate]);

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

      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi atualizada com sucesso. Redirecionando...",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verificando link...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Soccer Squad" 
            className="h-24 w-24 mx-auto rounded-full object-cover shadow-lg"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Soccer Squad
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={passwords.password}
                    onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwords.password.length > 0 && passwords.password.length < 8 && (
                  <p className="text-xs text-destructive">A senha deve ter pelo menos 8 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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
                  <p className="text-xs text-primary">✓ As senhas coincidem</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
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
