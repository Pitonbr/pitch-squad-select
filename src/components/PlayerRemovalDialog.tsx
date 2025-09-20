import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useTeams";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
}

interface PlayerRemovalDialogProps {
  player: Player;
  onPlayerRemoved: () => void;
}

export function PlayerRemovalDialog({ player, onPlayerRemoved }: PlayerRemovalDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();
  const { activeTeam } = useTeams();

  const handleRemovePlayer = async () => {
    if (!activeTeam) {
      toast({
        title: "Erro",
        description: "Nenhum time ativo encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsRemoving(true);
    try {
      const { data, error } = await supabase.rpc('remove_player_from_team', {
        _player_id: player.id,
        _team_id: activeTeam.id
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "Jogador Removido",
          description: result.message,
        });
        onPlayerRemoved();
      } else {
        toast({
          title: "Erro",
          description: result?.message || "Erro ao remover jogador.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error removing player:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover jogador do time.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserMinus className="h-4 w-4 mr-1" />
          Remover
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Jogador do Time</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja remover <strong>{player.name}</strong> ({player.nickname}) do time?
            </p>
            <p className="text-sm text-muted-foreground">
              O jogador será removido do time mas continuará podendo acessar o aplicativo. 
              Ele poderá ser convidado para outros times no futuro.
            </p>
            <p className="text-sm font-medium text-red-600">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemovePlayer}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRemoving ? "Removendo..." : "Remover Jogador"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}