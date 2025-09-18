import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force complete cache refresh - build 2025-01-18
console.log('Main: Soccer Manager v2.1 starting...');

createRoot(document.getElementById("root")!).render(<App />);
