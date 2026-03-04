import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

function mountApp() {
  const root = document.getElementById('root');
  if (!root) {
    requestAnimationFrame(mountApp);
    return;
  }
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

mountApp();
