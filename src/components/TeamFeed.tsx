import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { getInitialsAvatar } from "@/lib/avatar";

interface FeedPost {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
  players?: { name: string; nickname: string; profile_image: string | null } | null;
}

export function TeamFeed() {
  const { profile } = useAuth();
  const { activeTeam, isTeamAdmin } = useTeams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!activeTeam?.id) return;
    setLoading(true);
    const [{ data }, { data: teamPlayers }] = await Promise.all([
      supabase
        .from("team_feed_posts")
        .select("id, profile_id, content, created_at, profiles:profile_id(display_name)")
        .eq("team_id", activeTeam.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.rpc("get_team_players", { _team_id: activeTeam.id }),
    ]);
    const playersByProfileId = new Map((teamPlayers as any[] | null)?.map((p) => [p.profile_id, p]) || []);
    setPosts(
      ((data as any[]) || []).map((post) => ({ ...post, players: playersByProfileId.get(post.profile_id) || null }))
    );
    setLoading(false);
  }, [activeTeam?.id]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!activeTeam?.id) return;
    const channel = supabase
      .channel(`team-feed-${activeTeam.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_feed_posts", filter: `team_id=eq.${activeTeam.id}` }, fetchPosts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTeam?.id, fetchPosts]);

  const handlePost = async () => {
    if (!activeTeam?.id || !profile?.id || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("team_feed_posts").insert({
      team_id: activeTeam.id,
      profile_id: profile.id,
      content: content.trim(),
    });
    setPosting(false);
    if (error) { toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" }); return; }
    setContent("");
    await fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("team_feed_posts").delete().eq("id", postId);
    await fetchPosts();
  };

  const canDelete = (post: FeedPost) => post.profile_id === profile?.id || (activeTeam && isTeamAdmin(activeTeam.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            Resenha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Solta o verbo aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="button" onClick={handlePost} disabled={posting || !content.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              Postar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Carregando...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Ninguém postou nada ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const displayName = post.players?.nickname || post.players?.name || post.profiles?.display_name || "Jogador";
            return (
              <Card key={post.id}>
                <CardContent className="p-4 flex gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={post.players?.profile_image || getInitialsAvatar(displayName)} />
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{displayName}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words mt-1">{post.content}</p>
                  </div>
                  {canDelete(post) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
