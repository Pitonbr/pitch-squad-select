import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdatePrompt from "./components/UpdatePrompt";
import MobileOptimized from "./components/MobileOptimized";
import { AuthProvider } from "./hooks/useAuth";
import { TeamsProvider } from "./hooks/useTeams";
import { SafeProvider } from "./components/SafeProvider";
import { useErrorDetection } from "./components/SafeProvider";
import { useUpdateService } from "./hooks/useUpdateService";
import { ThemeProvider } from "./components/ThemeProvider";
import { useThemeSync } from "./hooks/useThemeSync";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { OfflineQueueProvider } from "./contexts/OfflineQueueContext";

const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GameInvitePage = lazy(() => import("./pages/GameInvitePage"));
const GameCheckInPage = lazy(() => import("./pages/GameCheckInPage"));
const Onboarding      = lazy(() => import("./pages/Onboarding"));
const PaymentSuccess  = lazy(() => import("./pages/PaymentSuccess"));
const Pricing         = lazy(() => import("./pages/Pricing"));

const SiteLanding      = lazy(() => import("./pages/site/Landing"));
const SiteTorneios     = lazy(() => import("./pages/site/Torneios"));
const SiteQuadras      = lazy(() => import("./pages/site/Quadras"));
const SitePlanos       = lazy(() => import("./pages/site/Planos"));
const SiteRankings     = lazy(() => import("./pages/site/RankingsPublicos"));

function ThemeSyncWrapper({ children }: { children: React.ReactNode }) {
  useThemeSync();
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry if it's a network error or auth error
        if (error instanceof Error && 
            (error.message.includes('NetworkError') || 
             error.message.includes('Unauthorized'))) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  }
});

const App = () => {
  // Initialize error detection
  useErrorDetection();
  
  // Initialize update service
  const { updateAvailable, updateInfo, applyUpdate } = useUpdateService();
  
  return (
    <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="soccer-squad-theme">
      <SafeProvider
        onError={(error, errorInfo) => {
          console.error('App-level error caught:', { error: error.message, errorInfo });
          // You could send this to an error reporting service here
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <ThemeSyncWrapper>
                <TeamsProvider>
                  <RealtimeProvider>
                    <OfflineQueueProvider>
                      <MobileOptimized className="min-h-screen no-overflow">
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                      <Suspense fallback={<div className="min-h-screen stadium-bg" />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/game-invite/:gameId" element={<GameInvitePage />} />
                          <Route path="/game-checkin/:gameId" element={<GameCheckInPage />} />
                          <Route path="/onboarding"      element={<Onboarding />} />
                          <Route path="/join/:code"      element={<Onboarding />} />
                          <Route path="/payment-success" element={<PaymentSuccess />} />
                          <Route path="/pricing"         element={<Pricing />} />
                          <Route path="/site"            element={<SiteLanding />} />
                          <Route path="/site/torneios"   element={<SiteTorneios />} />
                          <Route path="/site/quadras"    element={<SiteQuadras />} />
                          <Route path="/site/planos"     element={<SitePlanos />} />
                          <Route path="/site/rankings"   element={<SiteRankings />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                      <PWAInstallPrompt />
                      {updateAvailable && updateInfo && (
                        <UpdatePrompt 
                          onUpdateComplete={() => applyUpdate(updateInfo)}
                        />
                      )}
                        </BrowserRouter>
                      </MobileOptimized>
                    </OfflineQueueProvider>
                  </RealtimeProvider>
                </TeamsProvider>
              </ThemeSyncWrapper>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </SafeProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
