import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function mount() {
  const container = document.getElementById('root');
  if (!container) return;

  const root = createRoot(container);
  root.render(<App />);

  $(window).on('pagehide', () => root.unmount());
}

$(() => {
  mount();
});
