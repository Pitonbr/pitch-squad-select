import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdatePrompt from "./components/UpdatePrompt";
import MobileOptimized from "./components/MobileOptimized";
import { AuthProvider } from "./hooks/useAuth";
import { TeamsProvider } from "./hooks/useTeams";
import { SafeProvider } from "./components/SafeProvider";
import { useErrorDetection } from "./components/SafeProvider";
import { useUpdateService } from "./hooks/useUpdateService";

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
    <SafeProvider
      onError={(error, errorInfo) => {
        console.error('App-level error caught:', { error: error.message, errorInfo });
        // You could send this to an error reporting service here
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TeamsProvider>
              <MobileOptimized className="min-h-screen no-overflow">
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
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
            </TeamsProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SafeProvider>
  );
};

export default App;
