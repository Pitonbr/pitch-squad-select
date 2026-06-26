import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Trash2, Send, Megaphone, ThumbsUp, ThumbsDown, ImagePlus, X, BarChart3, Plus, Loader2, Images } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useRealtime } from "@/hooks/useRealtime";
import { useToast } from "@/hooks/use-toast";
import { getInitialsAvatar } from "@/lib/avatar";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
  players?: { name: string; nickname: string; profile_image: string | null } | null;
}

interface Announcement {
  id: string;
  body: string;
  photo_urls: string[];
  poll_options: string[] | null;
  poll_votes: number[] | null;
  my_vote: number | null;
  author_name: string;
  author_photo_url: string | null;
  like_count: number;
  dislike_count: number;
  my_reaction: "like" | "dislike" | null;
  created_at: string;
}

export function TeamFeed() {
  const { profile } = useAuth();
  const { activeTeam, isTeamAdmin } = useTeams();
  const { toast } = useToast();
  const isAdmin = activeTeam ? isTeamAdmin(activeTeam.id) : false;

  // ── Mensagens (chat aberto a todos) ──
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!activeTeam?.id) return;
    setLoadingPosts(true);
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
    setLoadingPosts(false);
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

  const handleDeletePost = async (postId: string) => {
    await supabase.from("team_feed_posts").delete().eq("id", postId);
    await fetchPosts();
  };

  const canDeletePost = (post: FeedPost) => post.profile_id === profile?.id || (activeTeam && isTeamAdmin(activeTeam.id));

  // ── Avisos & enquetes (somente admin posta, todos veem/reagem/votam) ──
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [body, setBody] = useState("");
  const [hasPoll, setHasPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    if (!activeTeam) return;
    const { data, error } = await supabase.rpc("get_team_announcements", { _team_id: activeTeam.id });
    if (!error) setAnnouncements((data as any) || []);
    setLoadingAnnouncements(false);
  }, [activeTeam]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleAnnouncementEvent = useCallback(() => fetchAnnouncements(), [fetchAnnouncements]);
  useRealtime({ table: "team_announcements", enabled: !!activeTeam, onEvent: handleAnnouncementEvent });
  useRealtime({ table: "team_announcement_reactions", enabled: !!activeTeam, onEvent: handleAnnouncementEvent });
  useRealtime({ table: "team_poll_votes", enabled: !!activeTeam, onEvent: handleAnnouncementEvent });

  const resetAnnouncementForm = () => {
    setBody("");
    setHasPoll(false);
    setPollOptions(["", ""]);
    setPhotos([]);
  };

  const handlePostAnnouncement = async () => {
    if (!activeTeam || !body.trim()) return;
    const validPollOptions = hasPoll ? pollOptions.map(o => o.trim()).filter(Boolean) : [];
    if (hasPoll && validPollOptions.length < 2) {
      toast({ title: "Enquete precisa de ao menos 2 opções", variant: "destructive" });
      return;
    }

    setPostingAnnouncement(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: authorProfile } = await supabase.from("profiles").select("id").eq("user_id", user!.id).single();

      const photoUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split(".").pop();
        const path = `${activeTeam.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("team-announcements").upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("team-announcements").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }

      const { error } = await supabase.from("team_announcements").insert({
        team_id: activeTeam.id,
        author_profile_id: authorProfile!.id,
        body: body.trim(),
        photo_urls: photoUrls,
        poll_options: hasPoll ? validPollOptions : null,
      });
      if (error) throw error;

      toast({ title: "Publicado na Resenha!" });
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleReact = async (announcementId: string, type: "like" | "dislike") => {
    const { error } = await supabase.rpc("toggle_announcement_reaction", { _announcement_id: announcementId, _reaction_type: type });
    if (error) { toast({ title: "Erro ao reagir", description: error.message, variant: "destructive" }); return; }
    fetchAnnouncements();
  };

  const handleVote = async (announcementId: string, optionIndex: number) => {
    const { error } = await supabase.rpc("vote_announcement_poll", { _announcement_id: announcementId, _option_index: optionIndex });
    if (error) { toast({ title: "Erro ao votar", description: error.message, variant: "destructive" }); return; }
    fetchAnnouncements();
  };

  const allPhotos = announcements.flatMap(a => a.photo_urls.map(url => ({ url, announcementId: a.id })));

  if (!activeTeam) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> Resenha</h2>
        <p className="text-muted-foreground">Mensagens, avisos, enquetes e fotos do {activeTeam.name}</p>
      </div>

      <Tabs defaultValue="mensagens">
        <TabsList>
          <TabsTrigger value="mensagens" className="gap-2"><MessageCircle className="h-4 w-4" /> Mensagens</TabsTrigger>
          <TabsTrigger value="avisos" className="gap-2"><Megaphone className="h-4 w-4" /> Avisos & Enquetes</TabsTrigger>
          <TabsTrigger value="galeria" className="gap-2"><Images className="h-4 w-4" /> Galeria ({allPhotos.length})</TabsTrigger>
        </TabsList>

        {/* ── Mensagens ── */}
        <TabsContent value="mensagens" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solta o verbo</CardTitle>
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

          {loadingPosts ? (
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
                      {canDeletePost(post) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => handleDeletePost(post.id)}
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
        </TabsContent>

        {/* ── Avisos & Enquetes ── */}
        <TabsContent value="avisos" className="space-y-4 mt-4">
          {isAdmin && (
            <Card>
              <CardHeader><CardTitle className="text-base">Novo Aviso</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Escreva um aviso para o time..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={3}
                />

                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photos.map((file, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(file)} className="h-16 w-16 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {hasPoll && (
                  <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opções da enquete (até 5)</p>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="flex-1 h-9 px-3 rounded-md border bg-background text-sm"
                          placeholder={`Opção ${i + 1}`}
                          value={opt}
                          onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                        />
                        {pollOptions.length > 2 && (
                          <Button variant="ghost" size="sm" onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setPollOptions(prev => [...prev, ""])}>
                        <Plus className="h-3 w-3" /> Adicionar opção
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file" accept="image/*" multiple className="hidden"
                        onChange={e => setPhotos(p => [...p, ...Array.from(e.target.files || [])])}
                      />
                      <span className="inline-flex items-center gap-1.5 text-sm px-3 h-9 rounded-md border hover:bg-muted">
                        <ImagePlus className="h-4 w-4" /> Fotos
                      </span>
                    </label>
                    <Button
                      type="button" variant={hasPoll ? "default" : "outline"} size="sm" className="gap-1.5"
                      onClick={() => setHasPoll(v => !v)}
                    >
                      <BarChart3 className="h-4 w-4" /> Enquete
                    </Button>
                  </div>
                  <Button onClick={handlePostAnnouncement} disabled={postingAnnouncement || !body.trim()} className="gap-2">
                    {postingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                    Publicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingAnnouncements ? (
            <p className="text-center text-muted-foreground py-8">Carregando avisos...</p>
          ) : announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="Nenhum aviso ainda" description="Quando o admin publicar um aviso, ele aparece aqui." />
          ) : (
            announcements.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={a.author_photo_url || getInitialsAvatar(a.author_name)} />
                      <AvatarFallback>{a.author_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{a.author_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{a.body}</p>

                  {a.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {a.photo_urls.map((url, i) => (
                        <img key={i} src={url} className="rounded-lg object-cover aspect-square w-full" />
                      ))}
                    </div>
                  )}

                  {a.poll_options && a.poll_votes && (
                    <div className="space-y-2">
                      {a.poll_options.map((opt, i) => {
                        const totalVotes = a.poll_votes!.reduce((s, v) => s + v, 0);
                        const count = a.poll_votes![i] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isMine = a.my_vote === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleVote(a.id, i)}
                            className={cn(
                              "relative w-full text-left rounded-lg border-2 overflow-hidden transition-all",
                              isMine ? "border-primary" : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />
                            <div className="relative z-10 flex items-center justify-between px-3 py-2 text-sm">
                              <span className={cn("font-medium", isMine && "text-primary")}>{opt}{isMine && " ✓"}</span>
                              <span className="text-xs text-muted-foreground">{count} voto{count !== 1 ? "s" : ""} · {pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm" variant={a.my_reaction === "like" ? "default" : "outline"} className="gap-1.5 h-8"
                      onClick={() => handleReact(a.id, "like")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> {a.like_count}
                    </Button>
                    <Button
                      size="sm" variant={a.my_reaction === "dislike" ? "destructive" : "outline"} className="gap-1.5 h-8"
                      onClick={() => handleReact(a.id, "dislike")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> {a.dislike_count}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Galeria ── */}
        <TabsContent value="galeria" className="mt-4">
          {allPhotos.length === 0 ? (
            <EmptyState icon={Images} title="Nenhuma foto ainda" description="Fotos anexadas aos avisos aparecem aqui." />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {allPhotos.map((p, i) => (
                <img key={i} src={p.url} className="rounded-lg object-cover aspect-square w-full" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
