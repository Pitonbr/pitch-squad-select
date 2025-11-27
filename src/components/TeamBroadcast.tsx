import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Users, UserCog, UsersRound, AlertCircle } from "lucide-react";
import { teamBroadcastSchema, type TeamBroadcastData, formatZodError } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTeams } from "@/hooks/useTeams";

interface TeamBroadcastProps {
  teamId: string;
}

export const TeamBroadcast = ({ teamId }: TeamBroadcastProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeamBroadcastData>({
    subject: "",
    message: "",
    recipientType: "all",
  });
  const { toast } = useToast();
  const { activeTeam } = useTeams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      teamBroadcastSchema.parse(formData);
    } catch (error: any) {
      toast({
        title: "Erro de validação",
        description: formatZodError(error),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("📧 Sending team broadcast:", { teamId, ...formData });

      // Call edge function to send broadcast emails
      const { data, error } = await supabase.functions.invoke('send-team-broadcast', {
        body: {
          teamId,
          subject: formData.subject,
          message: formData.message,
          recipientType: formData.recipientType,
        },
      });

      if (error) {
        console.error("❌ Error sending broadcast:", error);
        throw error;
      }

      console.log("✅ Broadcast sent successfully:", data);

      toast({
        title: "Emails enviados!",
        description: `${data.sentCount} email(s) enviado(s) com sucesso${data.failedCount > 0 ? `, ${data.failedCount} falhou(aram)` : ''}.`,
      });

      // Reset form
      setFormData({
        subject: "",
        message: "",
        recipientType: "all",
      });

    } catch (error: any) {
      console.error("❌ Error in broadcast:", error);
      toast({
        title: "Erro ao enviar emails",
        description: error.message || "Ocorreu um erro ao enviar os emails. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecipientIcon = () => {
    switch (formData.recipientType) {
      case "all": return <UsersRound className="h-4 w-4" />;
      case "players": return <Users className="h-4 w-4" />;
      case "admins": return <UserCog className="h-4 w-4" />;
    }
  };

  const getRecipientDescription = () => {
    switch (formData.recipientType) {
      case "all": return "Todos os membros do time";
      case "players": return "Apenas jogadores";
      case "admins": return "Apenas administradores";
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Comunicados em Massa
        </CardTitle>
        <CardDescription>
          Envie emails para todos os membros do time {activeTeam?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Use esta funcionalidade com responsabilidade. Todos os emails serão enviados 
            do domínio oficial (adm@soccersquad.com.br).
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Type */}
          <div className="space-y-2">
            <Label htmlFor="recipientType" className="flex items-center gap-2">
              {getRecipientIcon()}
              Destinatários
            </Label>
            <Select
              value={formData.recipientType}
              onValueChange={(value: "all" | "players" | "admins") =>
                setFormData({ ...formData, recipientType: value })
              }
            >
              <SelectTrigger id="recipientType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4" />
                    Todos os membros
                  </div>
                </SelectItem>
                <SelectItem value="players">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Apenas jogadores
                  </div>
                </SelectItem>
                <SelectItem value="admins">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Apenas administradores
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getRecipientDescription()}
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto do Email *</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Convocação para jogo importante"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.subject.length}/200 caracteres
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Digite sua mensagem aqui..."
              rows={8}
              maxLength={5000}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/5000 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !formData.subject.trim() || !formData.message.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" />
                Enviando emails...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Comunicado
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};