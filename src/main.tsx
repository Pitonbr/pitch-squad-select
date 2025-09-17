import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force complete cache refresh
console.log('Main: Soccer Manager v2.0 starting...');

createRoot(document.getElementById("root")!).render(<App />);
