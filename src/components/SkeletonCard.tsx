// ============================================================
// src/components/SkeletonCard.tsx  — FASE 3
// Skeleton screens para carregamento das seções principais.
// Substitui spinners simples por placeholders visuais.
//
// Uso:
//   <SkeletonCard lines={3} />
//   <SkeletonList count={4} />
//   <SkeletonMetrics />
// ============================================================

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton de card genérico
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24 mt-1" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(lines)].map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton de lista de jogadores/jogos
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Skeleton específico para as métricas do Dashboard
export function SkeletonMetrics() {
  return (
    <div className="mb-6 space-y-3">
      <Skeleton className="h-[88px] w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-7 w-10 mb-1" />
            <Skeleton className="h-2.5 w-20" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton para o Dashboard inteiro
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonMetrics />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
      </div>
      <SkeletonCard lines={5} />
    </div>
  );
}
