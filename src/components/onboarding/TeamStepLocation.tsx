// ============================================================
// src/components/onboarding/TeamStepLocation.tsx
// Wizard de time — Etapa 2/5: Localização (busca de endereço)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, ChevronRight, Info, CheckCircle2, MapPin } from "lucide-react";
import { TeamFormData } from "@/types/onboarding";
import { WizardProgress } from "./WizardProgress";

interface TeamStepLocationProps {
  initial?: Partial<TeamFormData>;
  onNext: (data: Partial<TeamFormData>) => void;
  onBack: () => void;
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
}

export function TeamStepLocation({ initial = {}, onNext, onBack }: TeamStepLocationProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState(initial.address ?? "");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [result, setResult] = useState<GeocodeResult | null>(
    initial.address && initial.lat ? {
      display_name: initial.address, lat: String(initial.lat), lon: String(initial.lng),
      address: { state_code: initial.state ?? "", city: initial.city ?? "", suburb: initial.neighborhood ?? "" },
    } : null
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const requestIdRef = useRef(0);

  // Busca em tempo real (autocomplete), com debounce de 450ms — conectado
  // à base nacional de endereços do OpenStreetMap/Nominatim (cobertura
  // completa do Brasil, sem necessidade de chave de API).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (result || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const thisRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=pt-BR&countrycodes=br`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        if (thisRequestId !== requestIdRef.current) return;
        const data = await res.json();
        setSuggestions(data || []);
      } catch {
        if (thisRequestId === requestIdRef.current) setSuggestions([]);
      } finally {
        if (thisRequestId === requestIdRef.current) setSearching(false);
      }
    }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, result]);

  const handleSelect = (item: GeocodeResult) => {
    setResult(item);
    setQuery(item.display_name);
    setSuggestions([]);
  };

  const handleChangeQuery = (value: string) => {
    setQuery(value);
    if (result) setResult(null);
  };

  const handleNext = () => {
    if (!result) {
      toast({ title: "Busque e selecione o endereço na lista", variant: "destructive" });
      return;
    }
    const addr = result.address;
    onNext({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      state: addr.state_code ?? addr.state ?? "",
      city: addr.city ?? addr.town ?? addr.municipality ?? "",
      neighborhood: addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? "",
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <WizardProgress step={2} total={5} label="Localização" />

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Onde vocês jogam?</h2>
          <p className="text-sm text-muted-foreground">
            Com o endereço, os jogadores sabem onde é o jogo e o grupo fica visível para peladeiros da região.
          </p>
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="addr">Endereço</Label>
          <div className="relative">
            <Input
              id="addr"
              placeholder="Digite rua, bairro ou cidade — Ex: R. 7 de Setembro, Anápolis"
              value={query}
              onChange={e => handleChangeQuery(e.target.value)}
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="flex items-start gap-2 w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="leading-snug">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {!result && !searching && query.trim().length >= 3 && suggestions.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum endereço encontrado. Tente ser mais específico.</p>
          )}
        </div>

        {result && (
          <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-primary bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-snug flex-1">{result.display_name}</p>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs shrink-0" onClick={() => { setResult(null); setQuery(""); }}>
              Trocar
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-sky-500" />
          <span>Grupos saudáveis atraem novos mensalistas! Quanto mais visível for sua pelada, mais fácil manter o elenco completo.</span>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-1" onClick={handleNext} disabled={!result}>
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
