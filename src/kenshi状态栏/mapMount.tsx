import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MapViewer from '../kenshi地图/components/MapViewer';
import '../kenshi地图/index.css';

const MAP_MOUNT_ATTRIBUTE = 'data-kenshi-map-mounted';

function mountMap() {
  const container = document.getElementById('map-root');
  if (!container) return;

  const existing = container.getAttribute(MAP_MOUNT_ATTRIBUTE);
  if (existing) return;

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <MapViewer />
    </StrictMode>,
  );
  container.setAttribute(MAP_MOUNT_ATTRIBUTE, 'true');
}

window.addEventListener('kenshi-map-mount', mountMap);
window.addEventListener('kenshi-map-visible', () => {
  window.dispatchEvent(new Event('resize'));
});

document.addEventListener('DOMContentLoaded', () => {
  const mapPane = document.getElementById('pane-map');
  if (mapPane && mapPane.classList.contains('active')) {
    mountMap();
  }
});
