import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { AuthProvider } from "./hooks/useAuth";
import { TeamsProvider } from "./hooks/useTeams";
import { SafeProvider } from "./components/SafeProvider";
import { useErrorDetection } from "./components/SafeProvider";

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
  console.log('App: Tournament system loaded - v3.0 - Comprehensive error fixes applied');
  
  // Initialize error detection
  useErrorDetection();
  
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
              </BrowserRouter>
            </TeamsProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SafeProvider>
  );
};

export default App;
