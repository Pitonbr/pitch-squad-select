// ============================================================
// src/components/AppOnboarding.tsx  — FASE 4
// Onboarding visual em 3 passos para novos usuários.
// Aparece na primeira visita (flag em localStorage).
// Pode ser reexibido via Settings.
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTeams } from "@/hooks/useTeams";
import { Trophy, Users, Calendar, ChevronRight, Check, Swords } from "lucide-react";

const STEPS = [
  {
    icon: Trophy,
    color: "bg-primary/15 text-primary",
    title: "Bem-vindo ao Soccer Squad!",
    subtitle: "Gerencie seu time de futebol de forma simples e moderna.",
    bullets: [
      "Cadastre jogadores e controle a presença",
      "Agende jogos e envie convocações",
      "Acompanhe rankings e estatísticas",
    ],
    cta: "Começar",
  },
  {
    icon: Users,
    color: "bg-blue-500/15 text-blue-500",
    title: "Seu time, seu controle",
    subtitle: "Gerencie o elenco e veja quem confirmou para cada jogo.",
    bullets: [
      "Adicione jogadores com foto e posição",
      "Confirme presença em 1 toque",
      "Veja o histórico de frequência",
    ],
    cta: "Próximo",
  },
  {
    icon: Swords,
    color: "bg-amber-500/15 text-amber-500",
    title: "Encontre adversários e quadras",
    subtitle: "Um diferencial único: conecte seu time ao ecossistema do futebol amador.",
    bullets: [
      "Busque times para marcar uma partida",
      "Encontre quadras próximas",
      "Crie e gerencie campeonatos",
    ],
    cta: "Entrar no app",
  },
];

interface AppOnboardingProps {
  onComplete: () => void;
}

export function AppOnboarding({ onComplete }: AppOnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem("onboarding_complete", "1");
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_complete", "1");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden">
          {/* Barra de progresso */}
          <Progress value={progress} className="h-1 rounded-none" />

          {/* Conteúdo */}
          <div className="p-6 space-y-5">
            {/* Ícone */}
            <div className={`w-16 h-16 rounded-2xl ${current.color} flex items-center justify-center mx-auto`}>
              <Icon className="h-8 w-8" aria-hidden="true" />
            </div>

            {/* Texto */}
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.subtitle}</p>
            </div>

            {/* Lista de bullets */}
            <ul className="space-y-2.5">
              {current.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground/80 leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Indicador de passos */}
            <div className="flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {step < STEPS.length - 1 ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
                Pular
              </Button>
            ) : <div />}
            <Button onClick={handleNext} className="gap-2 flex-1 max-w-[180px] ml-auto">
              {current.cta}
              {step < STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook auxiliar para controlar exibição do onboarding
export function useOnboarding() {
  const complete = localStorage.getItem("onboarding_complete") === "1";
  const [shown, setShown] = useState(!complete);
  return { showOnboarding: shown, completeOnboarding: () => setShown(false) };
}
