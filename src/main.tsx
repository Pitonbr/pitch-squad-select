import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CacheManager } from './utils/cacheManager'
import { RealtimeProvider } from './contexts/RealtimeContext'
import { OfflineQueueProvider } from './contexts/OfflineQueueContext'

// Force complete cache refresh - build 2025-01-18-fixed
console.log('Main: Soccer Manager v3.0 starting - Error fixes applied...');

// Initialize cache management first
CacheManager.initialize();

// Error boundary for React render errors
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(
    <RealtimeProvider>
      <OfflineQueueProvider>
        <App />
      </OfflineQueueProvider>
    </RealtimeProvider>
  );
} catch (error) {
  console.error('Critical error in main.tsx:', error);
  
  // Fallback error display
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: system-ui;
        background: #f8f9fa;
        color: #333;
      ">
        <div style="
          text-align: center; 
          padding: 2rem; 
          border: 1px solid #ddd; 
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Erro Crítico</h1>
          <p style="margin-bottom: 1rem;">Não foi possível carregar a aplicação.</p>
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button onclick="window.location.reload()" style="
              padding: 0.5rem 1rem; 
              background: #059669; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
            ">
              Recarregar
            </button>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="
              padding: 0.5rem 1rem; 
              background: #dc2626; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer;
            ">
              Limpar Cache
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
