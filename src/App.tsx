import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import GameInvitePage from "./pages/GameInvitePage";
import GameCheckInPage from "./pages/GameCheckInPage";
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
  console.log('App: Tournament system loaded - v3.1.0 - Update system implemented');
  
  // Initialize error detection
  useErrorDetection();
  
  // Initialize update service
  const { updateAvailable, updateInfo, applyUpdate } = useUpdateService();
  
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="soccer-squad-theme">
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
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/game-invite/:gameId" element={<GameInvitePage />} />
                        <Route path="/game-checkin/:gameId" element={<GameCheckInPage />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
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
  );
};

export default App;
