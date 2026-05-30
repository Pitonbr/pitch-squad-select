// ============================================================
// src/components/CourtFinder.tsx  — FASE 4
// Busca de quadras próximas — diferencial único do app.
// Usa Google Places API via link externo + lista curada.
// (Integração completa requer chave de API no .env)
// ============================================================

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { MapPin, Search, Navigation, ExternalLink, Star, Clock, Phone } from "lucide-react";

interface Court {
  id: string;
  name: string;
  address: string;
  type: "society" | "campo" | "futsal" | "beach";
  rating?: number;
  distance?: string;
  openNow?: boolean;
  phone?: string;
  mapsUrl?: string;
}

const TYPE_LABEL: Record<Court["type"], string> = {
  society: "Society",
  campo:   "Campo",
  futsal:  "Futsal",
  beach:   "Beach Soccer",
};

const TYPE_COLOR: Record<Court["type"], string> = {
  society: "bg-primary/15 text-primary border-primary/25",
  campo:   "bg-green-500/15 text-green-600 border-green-500/25",
  futsal:  "bg-blue-500/15 text-blue-600 border-blue-500/25",
  beach:   "bg-amber-500/15 text-amber-600 border-amber-500/25",
};

export function CourtFinder() {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [searched, setSearched] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Busca geolocalização do navegador
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setGeoLoading(false);
        // Abre busca no Google Maps diretamente com termo de quadra
        const url = `https://www.google.com/maps/search/quadra+de+futebol/@${latitude},${longitude},14z`;
        window.open(url, "_blank", "noopener");
      },
      () => {
        setGeoLoading(false);
      }
    );
  };

  // Busca via Google Maps externo (integração completa requer Places API)
  const handleSearch = () => {
    if (!location.trim()) return;
    const query = encodeURIComponent(`quadra de futebol perto de ${location}`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank", "noopener");
    setSearched(true);

    // Dados de demonstração — substituir por chamada real à Places API
    setLoading(true);
    setTimeout(() => {
      setCourts([
        { id: "1", name: "Arena Soccer Premium", address: `Próximo a ${location}`, type: "society", rating: 4.5, distance: "1.2 km", openNow: true, mapsUrl: `https://www.google.com/maps/search/quadra+de+futebol+${encodeURIComponent(location)}` },
        { id: "2", name: "Complexo Esportivo Central", address: `Perto de ${location}`, type: "campo", rating: 4.2, distance: "2.5 km", openNow: false, mapsUrl: `https://www.google.com/maps/search/campo+de+futebol+${encodeURIComponent(location)}` },
        { id: "3", name: "Futsal Park", address: `Região de ${location}`, type: "futsal", rating: 4.7, distance: "0.8 km", openNow: true, mapsUrl: `https://www.google.com/maps/search/futsal+${encodeURIComponent(location)}` },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Encontrar Quadra
        </h2>
        <p className="text-sm text-muted-foreground">
          Busque quadras próximas para agendar seu jogo
        </p>
      </div>

      {/* Busca */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Bairro, cidade ou CEP..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="pl-10"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleGeolocate}
          disabled={geoLoading}
          title="Usar minha localização"
          className="shrink-0"
        >
          <Navigation className={`h-4 w-4 ${geoLoading ? "animate-pulse text-primary" : ""}`} />
        </Button>
        <Button onClick={handleSearch} disabled={!location.trim() || loading} className="shrink-0 gap-2">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 flex-wrap">
        {(["society", "campo", "futsal", "beach"] as Court["type"][]).map(t => (
          <Badge key={t} variant="outline" className={`cursor-pointer hover:${TYPE_COLOR[t]} transition-colors`}>
            {TYPE_LABEL[t]}
          </Badge>
        ))}
      </div>

      {/* Resultados */}
      {!searched && !loading && (
        <Card className="border-dashed border-muted-foreground/25">
          <CardContent className="py-10">
            <EmptyState
              icon={MapPin}
              title="Busque quadras perto de você"
              description='Digite um bairro ou cidade e clique em "Buscar" para encontrar quadras disponíveis'
            />
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-40" />
                  <div className="h-3 bg-muted rounded w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && courts.length > 0 && (
        <div className="space-y-3">
          {courts.map(court => (
            <Card key={court.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold truncate">{court.name}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${TYPE_COLOR[court.type]}`}>
                        {TYPE_LABEL[court.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{court.address}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {court.distance && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Navigation className="h-3 w-3" />{court.distance}
                        </span>
                      )}
                      {court.rating && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" />{court.rating}
                        </span>
                      )}
                      {court.openNow !== undefined && (
                        <span className={`flex items-center gap-1 text-[11px] ${court.openNow ? "text-green-500" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          {court.openNow ? "Aberto agora" : "Fechado"}
                        </span>
                      )}
                    </div>
                  </div>
                  {court.mapsUrl && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary" asChild>
                      <a href={court.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir no Maps">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
