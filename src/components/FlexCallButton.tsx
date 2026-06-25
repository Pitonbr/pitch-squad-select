import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function FlexCallButton({ gameId }: { gameId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCall = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("notify_flex_players", { p_game_id: gameId });
      if (error) throw error;
      const count = (data as number) || 0;
      toast({
        title: count > 0 ? "Jogadores flex avisados!" : "Nada a avisar",
        description: count > 0
          ? `${count} jogador(es) flex foram notificados sobre vagas neste jogo.`
          : "O jogo já está com vagas preenchidas ou não há jogadores flex no time.",
      });
    } catch (err: any) {
      toast({ title: "Erro ao chamar jogadores flex", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCall} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
      Chamar jogadores flex
    </Button>
  );
}
