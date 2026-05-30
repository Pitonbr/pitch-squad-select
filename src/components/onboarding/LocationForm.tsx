// ============================================================
// src/components/onboarding/LocationForm.tsx
// Tela B.3.1 — Onde você mora?
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navigation, Loader2, ChevronRight } from "lucide-react";
import { LocationPreferences, BRAZIL_STATES } from "@/types/onboarding";

interface LocationFormProps {
  initial?: Partial<LocationPreferences>;
  onNext: (data: LocationPreferences) => void;
  onBack: () => void;
}

export function LocationForm({ initial = {}, onNext, onBack }: LocationFormProps) {
  const { toast } = useToast();
  const [state, setState]  = useState(initial.state ?? "");
  const [city, setCity]    = useState(initial.city ?? "");
  const [hood, setHood]    = useState(initial.neighborhood ?? "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | undefined>(
    initial.lat ? { lat: initial.lat, lng: initial.lng! } : undefined
  );

  const handleGeo = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocalização não suportada", description: "Preencha os campos manualmente." });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        // Reverse geocode via nominatim (free, no key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
            { headers: { "Accept-Language": "pt-BR" } }
          );
          const data = await res.json();
          const addr = data.address;
          setState(addr.state_code ?? addr.state ?? "");
          setCity(addr.city ?? addr.town ?? addr.municipality ?? "");
          setHood(addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? "");
        } catch {
          toast({ title: "Localização obtida", description: "Preencha cidade e bairro manualmente." });
        } finally { setGeoLoading(false); }
      },
      () => {
        setGeoLoading(false);
        toast({ title: "Permissão negada", description: "Preencha os campos manualmente.", variant: "destructive" });
      }
    );
  };

  const handleNext = () => {
    if (!state || !city.trim() || !hood.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha estado, cidade e bairro.", variant: "destructive" });
      return;
    }
    onNext({ state, city: city.trim(), neighborhood: hood.trim(), lat: coords?.lat, lng: coords?.lng });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Onde você mora?</h2>
        <p className="text-sm text-muted-foreground">Vamos encontrar jogos perto de você</p>
      </div>

      {/* Geolocation button */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
        onClick={handleGeo}
        disabled={geoLoading}
      >
        {geoLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Navigation className="h-4 w-4" />}
        {geoLoading ? "Obtendo localização..." : "🧭 Usar minha localização atual"}
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {BRAZIL_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            placeholder="Ex: São Paulo"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hood">Bairro *</Label>
          <Input
            id="hood"
            placeholder="Ex: Vila Mariana, Pinheiros..."
            value={hood}
            onChange={e => setHood(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Usaremos isso para calcular a distância dos jogos disponíveis
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-1" onClick={handleNext}>
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
