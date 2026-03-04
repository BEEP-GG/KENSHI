import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function mount() {
  const container = document.getElementById('app');
  if (!container) return;

  const root = createRoot(container);
  root.render(<App />);

  window.addEventListener('pagehide', () => root.unmount(), { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
