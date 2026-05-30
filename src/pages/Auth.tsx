import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Mail, User } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
import { useAuth } from "@/hooks/useAuth";
import { EmailVerification } from "@/components/EmailVerification";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoImage from "@/assets/soccer-squad-logo.jpeg";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";

type AuthStep = 'auth' | 'verification';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    displayName: ""
  });
  const [authStep, setAuthStep] = useState<AuthStep>('auth');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Check for existing session and invite code
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkSession();

    // Check for invite code
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteCode(invite);
      toast({
        title: "Convite Detectado! 🎉",
        description: "Complete seu cadastro para entrar automaticamente no time.",
      });
    }

    // Check for redirect parameter
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, [navigate, searchParams, toast]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTo || '/'}`,
        },
      });
      if (error) {
        toast({ title: "Erro ao entrar com Google", description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Não foi possível conectar com o Google.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erro no login",
            description: "Email ou senha incorretos.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('[Auth] Login successful, redirecting to:', redirectTo || '/');
      
      toast({
        title: "✅ Login realizado!",
        description: "Bem-vindo de volta!"
      });

      // Redirect to specified page (like game check-in) or home
      navigate(redirectTo || "/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEmailVerification = () => {
    setAuthStep('verification');
  };

  const handleVerificationSuccess = async () => {
    console.log('[Auth] Verification success, handling invite and redirect', { inviteCode, redirectTo });
    
    toast({
      title: "Cadastro concluído!",
      description: "Bem-vindo ao Soccer Squad!",
    });
    
    // Handle invite code if present - join team first
    if (inviteCode) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileData) {
            const { data: joinResult } = await supabase.rpc("join_team_by_invite_code", {
              _invite_code: inviteCode,
              _profile_id: profileData.id,
            });

            if (joinResult && joinResult.length > 0 && joinResult[0].success) {
              console.log('[Auth] Successfully joined team:', joinResult[0].team_name);
              toast({
                title: "✅ Entrou no time!",
                description: `Você foi adicionado ao time ${joinResult[0].team_name}`,
              });
              
              // If no specific redirect (game), go to home to see the team
              if (!redirectTo) {
                navigate("/");
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error joining team:", error);
      }
    }
    
    // Redirect to specified page (like game check-in) or home
    console.log('[Auth] Navigating to:', redirectTo || '/');
    navigate(redirectTo || "/", { replace: true });
  };

  const handleBackToAuth = () => {
    setAuthStep('auth');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !resetEmail.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      // Call edge function to generate token and send email via Resend
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email: resetEmail,
          redirectTo: `${window.location.origin}/reset-password`
        },
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Render email verification step
  if (authStep === 'verification') {
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
        <EmailVerification
          email={signupData.email}
          password={signupData.password}
          displayName={signupData.displayName}
          inviteCode={inviteCode || undefined}
          onSuccess={handleVerificationSuccess}
          onBack={handleBackToAuth}
        />
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
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Soccer Squad" 
            className="h-24 w-24 mx-auto rounded-full object-cover shadow-[0_0_30px_rgba(63,184,175,0.6)] ring-4 ring-primary/30"
          />
          <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_25px_rgba(63,184,175,0.5)]">
            Soccer Squad — Gestão de Times de Futebol
          </h1>
          <p className="text-cyan-100/95">Gerencie seu time de futebol</p>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-2 border-primary/30">
          <Tabs defaultValue="login" value={inviteCode ? "signup" : undefined}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-primary/20">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-white">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium gap-3"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Continuar com Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/40 px-2 text-white/50">ou</span>
                  </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pr-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-primary" />
                        ) : (
                          <Eye className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                     </div>
                   </div>

                   <div className="text-center">
                     <button
                       type="button"
                       onClick={() => setShowForgotPassword(true)}
                       className="text-sm text-primary hover:text-accent transition-colors"
                     >
                       Esqueci minha senha
                     </button>
                   </div>

                   <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-medium transition-colors" disabled={loading}>
                     {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Entrar
                   </Button>
                 </form>
               </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium gap-3"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <GoogleIcon />
                    Cadastrar com Google
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black/40 px-2 text-white/50">ou cadastre com email</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white font-medium">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-accent" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupData.displayName}
                        onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                        className="pl-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                        required
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pr-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-accent" />
                        ) : (
                          <Eye className="h-4 w-4 text-accent" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full mt-4 bg-primary hover:bg-accent text-white font-medium transition-colors"
                    onClick={handleStartEmailVerification}
                    disabled={!signupData.email || !signupData.password || !signupData.displayName}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Cadastrar via Email
                  </Button>
                  
                  <p className="text-xs text-center text-cyan-100/90 mt-2">
                    Você receberá um link de confirmação no seu email
                  </p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="bg-black/90 backdrop-blur-md border-2 border-primary/30">
            <DialogHeader>
              <DialogTitle className="text-white">Recuperar Senha</DialogTitle>
              <DialogDescription className="text-cyan-100/90">
                Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 bg-black/30 border-primary/50 text-white placeholder:text-gray-400 focus:border-accent focus:ring-accent/20"
                    required
                    disabled={isResettingPassword}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-medium transition-colors" disabled={isResettingPassword}>
                {isResettingPassword ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Auth;