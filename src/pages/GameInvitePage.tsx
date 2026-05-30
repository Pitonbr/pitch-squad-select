import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Loader2, LogIn, UserPlus, Download, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import logoImage from "@/assets/soccer-squad-logo.jpeg";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  status: string;
  team_id: string;
}

export default function GameInvitePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[GameInvitePage] Component loaded', { gameId, user: !!user, authLoading });

  // Fetch game data and check authentication
  useEffect(() => {
    const fetchGame = async () => {
      console.log('[GameInvitePage] Fetching game data for:', gameId);
      
      if (!gameId) {
        console.error('[GameInvitePage] No gameId provided');
        setError("Link de convite inválido");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .maybeSingle();

        console.log('[GameInvitePage] Game fetch result:', { data, error: fetchError });

        if (fetchError || !data) {
          console.error('[GameInvitePage] Game not found:', fetchError);
          setError("Jogo não encontrado");
          setLoading(false);
          return;
        }

        console.log('[GameInvitePage] Game loaded successfully:', data.title);
        setGame(data as Game);
        setLoading(false);

        // If user is already authenticated, redirect immediately to check-in
        if (!authLoading && user) {
          console.log('[GameInvitePage] User already authenticated, redirecting to check-in');
          navigate(`/game-checkin/${gameId}`, { replace: true });
        }
      } catch (err) {
        console.error("[GameInvitePage] Error fetching game:", err);
        setError("Erro ao carregar informações do jogo");
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchGame();
    }
  }, [gameId, user, authLoading, navigate]);

  const formatGameDate = (date: string, time: string) => {
    const gameDate = new Date(`${date}T${time}`);
    return {
      date: gameDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: time
    };
  };

  const handleLoginRedirect = () => {
    navigate(`/auth?redirect=/game-checkin/${gameId}`);
  };

  const handleSignupRedirect = () => {
    navigate(`/auth?redirect=/game-checkin/${gameId}`);
  };

  const createWhatsAppMessage = () => {
    if (!game) return "";
    
    const formattedDate = formatGameDate(game.date, game.time);
    
    return `🎉 Você foi convidado para uma partida no Soccer Squad!

⚽ *"${game.title}"*
📅 ${formattedDate.date}
🕐 ${formattedDate.time}
📍 ${game.location}
${game.description ? `💬 ${game.description}\n` : ''}
👉 *Clique no link e faça seu login:*
🔗 ${window.location.href}

📱 Se ainda não tem o app instalado:
1️⃣ Instale o Soccer Squad
2️⃣ Cadastre-se ou faça login
3️⃣ Confirme sua presença no jogo

Nos vemos no campo! ⚽🔥`;
  };

  const shareViaWhatsApp = () => {
    const message = createWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading || authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(26, 46, 61, 0.85), rgba(10, 20, 30, 0.9)), url(${soccerFieldHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
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
        <Card className="bg-black/40 backdrop-blur-md border-2 border-destructive/50 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">❌ Convite Inválido</h2>
            <p className="text-white/70 mb-4">{error}</p>
            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-accent">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = formatGameDate(game.date, game.time);

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
      <Helmet>
        <title>{`Convite: ${game.title} — Soccer Squad`}</title>
        <meta name="description" content={`Você foi convidado para a partida ${game.title} em ${game.location}. Acesse e confirme sua presença no Soccer Squad.`} />
        <link rel="canonical" href={`https://soccersquad.com.br/game-invite/${gameId}`} />
        <meta property="og:title" content={`Convite para ${game.title}`} />
        <meta property="og:description" content={`${game.title} • ${game.location}`} />
        <meta property="og:url" content={`https://soccersquad.com.br/game-invite/${gameId}`} />
        <meta property="og:type" content="article" />
      </Helmet>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <img 
            src={logoImage} 
            alt="Soccer Squad" 
            className="h-24 w-24 mx-auto rounded-full object-cover shadow-[0_0_30px_rgba(63,184,175,0.6)] ring-4 ring-primary/30"
          />
          <h1 className="text-2xl font-bold text-white drop-shadow-[0_0_25px_rgba(63,184,175,0.5)] leading-relaxed">
            Você foi convidado para uma partida no Soccer Squad
          </h1>
          <p className="text-lg text-white/90">
            Clique aqui e faça seu login
          </p>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-2 border-primary/30">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-lg border border-primary/30">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">
                  ⚽ {game.title}
                </h2>
                
                <div className="space-y-3 text-white/90">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="capitalize">{formattedDate.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{formattedDate.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{game.location}</span>
                  </div>
                </div>

                {game.description && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-white/80 text-sm">{game.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Já tenho conta - Fazer Login
              </Button>

              <Button
                onClick={handleSignupRedirect}
                className="w-full bg-accent hover:bg-accent/90 text-white font-medium h-12"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Criar conta e confirmar presença
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black/40 px-2 text-white/60">ou</span>
                </div>
              </div>

              <Button
                onClick={shareViaWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-12"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Compartilhar Convite no WhatsApp
              </Button>
            </div>

            <div className="bg-black/30 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-white/90 font-semibold text-sm text-center">
                📱 Não tem o aplicativo?
              </p>
              <div className="space-y-2 text-xs text-white/70">
                <p className="flex items-start gap-2">
                  <Download className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Baixe o Soccer Squad e tenha acesso completo ao sistema de gerenciamento</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Instale o aplicativo no seu dispositivo</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Crie sua conta ou faça login</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Confirme sua presença no jogo automaticamente</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/60 text-sm">
          Nos vemos no campo, jogador! ⚽🔥
        </p>
      </div>
    </div>
  );
}
