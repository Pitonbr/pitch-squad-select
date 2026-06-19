// ============================================================
// src/components/onboarding/TeamStepLocation.tsx
// Wizard de time — Etapa 2/5: Localização (busca de endereço)
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, ChevronRight, Info, CheckCircle2 } from "lucide-react";
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
  const [result, setResult] = useState<GeocodeResult | null>(
    initial.address && initial.lat ? {
      display_name: initial.address, lat: String(initial.lat), lon: String(initial.lng),
      address: { state_code: initial.state ?? "", city: initial.city ?? "", suburb: initial.neighborhood ?? "" },
    } : null
  );

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&accept-language=pt-BR&countrycodes=br`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      if (data.length === 0) {
        toast({ title: "Endereço não encontrado", description: "Tente ser mais específico.", variant: "destructive" });
        return;
      }
      setResult(data[0]);
    } catch {
      toast({ title: "Erro ao buscar endereço", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleNext = () => {
    if (!result) {
      toast({ title: "Busque e confirme o endereço", variant: "destructive" });
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

        <div className="space-y-2">
          <Label htmlFor="addr">Endereço</Label>
          <div className="flex gap-2">
            <Input
              id="addr"
              placeholder="Ex: R. 7 de Setembro, Anápolis - GO"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <Button type="button" variant="outline" onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {result && (
          <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-primary bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-snug">{result.display_name}</p>
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
