import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/reader.css';
import './styles/guide.css';
import './lib/fonts';
import { setPwa } from './lib/pwa';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Bản dev không có service worker (devOptions tắt) nên chỉ ghi nhận ở bản build. */
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onOfflineReady() {
        setPwa({ cached: true });
      },
      onRegisteredSW(_url, registration) {
        registration?.addEventListener('updatefound', () => setPwa({ cached: true }));
      },
    });
  });
}
