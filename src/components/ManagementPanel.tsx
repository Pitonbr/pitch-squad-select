import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Crown, UserPlus, Settings } from "lucide-react";
import { RoleManagement } from "./RoleManagement";
import { TreasurerSelector } from "./TreasurerSelector";
import { TeamJoinRequests } from "./TeamJoinRequests";
import { useTeams } from "@/hooks/useTeams";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ManagementPanel = () => {
  const { activeTeam, isTeamAdmin } = useTeams();

  if (!activeTeam || !isTeamAdmin(activeTeam.id)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="glass-panel">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Apenas administradores têm acesso ao painel de gerenciamento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow-cyan mb-2">Painel de Gerenciamento</h1>
        <p className="text-muted-foreground">
          Gerencie permissões, papéis e configurações avançadas do time {activeTeam.name}
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Avançadas
          </CardTitle>
          <CardDescription>
            Configure permissões, papéis e outras configurações do time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" />
                <span>Papéis e Permissões</span>
              </TabsTrigger>
              <TabsTrigger value="treasurer" className="gap-2">
                <Crown className="h-4 w-4" />
                <span>Tesoureiro</span>
              </TabsTrigger>
              <TabsTrigger value="joinRequests" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Solicitações</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="roles" className="mt-6">
              <RoleManagement />
            </TabsContent>
            
            <TabsContent value="treasurer" className="mt-6">
              <TreasurerSelector />
            </TabsContent>
            
            <TabsContent value="joinRequests" className="mt-6">
              <TeamJoinRequests />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
