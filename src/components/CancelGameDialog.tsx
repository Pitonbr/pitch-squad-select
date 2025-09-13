import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CancelGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  gameTitle: string;
  invitedPlayersCount: number;
}

export function CancelGameDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  gameTitle,
  invitedPlayersCount 
}: CancelGameDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sendMessage, setSendMessage] = useState(true);

  const handleConfirm = () => {
    if (sendMessage && !message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Digite uma mensagem para enviar aos jogadores.",
        variant: "destructive"
      });
      return;
    }

    onConfirm(sendMessage ? message : "");
    setMessage("");
    setSendMessage(true);
    onClose();
  };

  const handleClose = () => {
    setMessage("");
    setSendMessage(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>Cancelar Jogo</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <p className="text-sm">
              Você está prestes a cancelar o jogo <strong>"{gameTitle}"</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {invitedPlayersCount} jogadores convidados serão notificados.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendMessage"
                checked={sendMessage}
                onChange={(e) => setSendMessage(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sendMessage" className="text-sm">
                Enviar mensagem aos jogadores convidados
              </Label>
            </div>

            {sendMessage && (
              <div className="space-y-2">
                <Label htmlFor="cancelMessage">Mensagem de Cancelamento</Label>
                <Textarea
                  id="cancelMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique o motivo do cancelamento para os jogadores..."
                  className="w-full"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Esta mensagem será enviada para todos os {invitedPlayersCount} jogadores convidados.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {sendMessage ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Cancelar e Notificar
              </>
            ) : (
              "Cancelar Jogo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}