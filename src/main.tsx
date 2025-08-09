import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Starting React app...');
const root = document.getElementById("root");
console.log('Root element:', root);

if (root) {
  createRoot(root).render(<App />);
  console.log('App rendered successfully');
} else {
  console.error('Root element not found!');
}
