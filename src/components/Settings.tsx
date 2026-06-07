import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Lock, Shirt, CreditCard, Tag, Megaphone } from "lucide-react";
import { NotificationSettings }  from "./NotificationSettings";
import { PlayerProfileEditor }   from "./PlayerProfileEditor";
import { SubscriptionManager }   from "./payment/SubscriptionManager";
import { PromoCodeManager }      from "./admin/PromoCodeManager";
import { MarketingManager }      from "./admin/MarketingManager";

const MASTER_ADMIN_EMAIL = "alexpiton@gmail.com";

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isMasterAdmin = user?.email === MASTER_ADMIN_EMAIL;

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.rpc("create_audit_log", {
        _action: "PASSWORD_CHANGE",
        _resource_type: "auth",
        _resource_id: user?.id,
      });
      toast({ title: "Senha alterada", description: "Você será desconectado." });
      setTimeout(() => { supabase.auth.signOut(); }, 2000);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const tabCount = isMasterAdmin ? 6 : 4;
  const gridCols = isMasterAdmin ? "grid-cols-6" : "grid-cols-4";

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-background/80 backdrop-blur-md border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            Configurações
            {isMasterAdmin && (
              <span className="text-xs font-normal bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                Master Admin
              </span>
            )}
          </CardTitle>
          <CardDescription>Gerencie suas preferências e informações da conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="player" className="w-full">
            <TabsList className={`grid w-full ${gridCols} overflow-x-auto`}>
              <TabsTrigger value="player" className="flex items-center gap-1.5 text-xs">
                <Shirt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Meu Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-1.5 text-xs">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Assinatura</span>
                <span className="sm:hidden">Plano</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Notificações</span>
                <span className="sm:hidden">Avisos</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs">
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Segurança</span>
                <span className="sm:hidden">Senha</span>
              </TabsTrigger>

              {/* Master admin only */}
              {isMasterAdmin && (
                <>
                  <TabsTrigger value="admin-finance" className="flex items-center gap-1.5 text-xs text-amber-600">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Financeiro</span>
                    <span className="sm:hidden">Finanças</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin-marketing" className="flex items-center gap-1.5 text-xs text-amber-600">
                    <Megaphone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Marketing</span>
                    <span className="sm:hidden">Mkt</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="player" className="pt-4">
              <PlayerProfileEditor />
            </TabsContent>

            <TabsContent value="subscription" className="pt-4">
              <SubscriptionManager />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full"
                  variant="destructive"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alterar Senha
                </Button>
                <p className="text-xs text-muted-foreground">
                  Após alterar a senha, você será desconectado e precisará fazer login novamente.
                </p>
              </div>
            </TabsContent>

            {/* Master admin panels */}
            {isMasterAdmin && (
              <>
                <TabsContent value="admin-finance" className="pt-4">
                  <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                    <p className="text-xs text-amber-700 font-medium">
                      Painel exclusivo — Gestão de Códigos Promocionais e Vouchers
                    </p>
                  </div>
                  <PromoCodeManager />
                </TabsContent>

                <TabsContent value="admin-marketing" className="pt-4">
                  <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                    <p className="text-xs text-amber-700 font-medium">
                      Painel exclusivo — Campanhas e Mensagens para Usuários
                    </p>
                  </div>
                  <MarketingManager />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
