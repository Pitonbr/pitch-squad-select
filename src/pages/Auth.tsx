import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, Mail, User, Phone, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SMSVerification } from "@/components/SMSVerification";
import { EmailVerification } from "@/components/EmailVerification";
import { WhatsAppVerification } from "@/components/WhatsAppVerification";

type VerificationMethod = 'email' | 'sms' | 'whatsapp' | null;
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
    displayName: "", 
    phone: "" 
  });
  const [authStep, setAuthStep] = useState<AuthStep>('auth');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(null);

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
  }, [navigate, searchParams, toast]);

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

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!"
      });

      navigate("/");
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

  const handleVerificationMethodSelect = (method: VerificationMethod) => {
    setVerificationMethod(method);
    setAuthStep('verification');
  };

  const handleVerificationSuccess = () => {
    toast({
      title: "Cadastro concluído!",
      description: "Bem-vindo ao Soccer Manager!",
    });
    
    // Handle invite code if present
    if (inviteCode) {
      setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id")
              .eq("user_id", user.id)
              .single();

            if (profileData) {
              const { data: joinResult } = await supabase.rpc("join_team_by_invite_code", {
                _invite_code: inviteCode,
                _profile_id: profileData.id,
              });

              if (joinResult && joinResult.length > 0 && joinResult[0].success) {
                toast({
                  title: "Entrou no time!",
                  description: `Você foi adicionado ao time ${joinResult[0].team_name}`,
                });
              }
            }
          }
        } catch (error) {
          console.error("Error joining team:", error);
        }
      }, 1000);
    }
    
    navigate("/");
  };

  const handleBackToAuth = () => {
    setAuthStep('auth');
    setVerificationMethod(null);
  };

  // Render verification step
  if (authStep === 'verification') {
    if (verificationMethod === 'sms') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
          <SMSVerification
            phone={signupData.phone}
            email={signupData.email}
            password={signupData.password}
            displayName={signupData.displayName}
            onSuccess={handleVerificationSuccess}
            onBack={handleBackToAuth}
          />
        </div>
      );
    }

    if (verificationMethod === 'whatsapp') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
          <WhatsAppVerification
            phone={signupData.phone}
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

    if (verificationMethod === 'email') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Soccer Manager</h1>
          <p className="text-gray-600 mt-2">Gerencie seu time de futebol</p>
        </div>

        <Card>
          <Tabs defaultValue="login" value={inviteCode ? "signup" : undefined}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pr-10"
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
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={signupData.displayName}
                        onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+55 11 99999-9999"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pr-10"
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
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Label className="text-base font-medium">Como deseja confirmar seu cadastro?</Label>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleVerificationMethodSelect('email')}
                      disabled={!signupData.email || !signupData.password || !signupData.displayName}
                    >
                      <Mail className="h-6 w-6 text-blue-600" />
                      <div className="text-center">
                        <div className="font-medium">Por Email</div>
                        <div className="text-sm text-muted-foreground">
                          Receba um link de confirmação
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleVerificationMethodSelect('whatsapp')}
                      disabled={!signupData.phone || !signupData.email || !signupData.password || !signupData.displayName}
                    >
                      <MessageSquare className="h-6 w-6 text-green-600" />
                      <div className="text-center">
                        <div className="font-medium">Por WhatsApp</div>
                        <div className="text-sm text-muted-foreground">
                          Receba um código instantâneo
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleVerificationMethodSelect('sms')}
                      disabled={!signupData.phone || !signupData.email || !signupData.password || !signupData.displayName}
                    >
                      <Phone className="h-6 w-6 text-purple-600" />
                      <div className="text-center">
                        <div className="font-medium">Por SMS</div>
                        <div className="text-sm text-muted-foreground">
                          Receba um código no seu celular
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;