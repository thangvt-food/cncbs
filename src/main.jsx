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
import {
  applyUpdate,
  bindRegistration,
  bindUpdate,
  checkForUpdate,
  setPwa,
  startUpdateWatch,
} from './lib/pwa';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Bản dev không có service worker (devOptions tắt) nên chỉ ghi nhận ở bản build. */
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setPwa({ needRefresh: true });
        /* Vừa mở app, chưa thao tác gì: áp luôn bản mới để máy không kẹt ở bản cũ. */
        if (performance.now() < 10_000) applyUpdate();
      },
      onOfflineReady() {
        setPwa({ cached: true });
      },
      onRegisteredSW(_url, registration) {
        bindRegistration(registration);
        startUpdateWatch();
        checkForUpdate(true);
        if (navigator.serviceWorker.controller) setPwa({ cached: true });
      },
      onRegisterError() {
        /* PWA chỉ là lớp phụ: lỗi đăng ký không được chặn app. */
      },
    });
    bindUpdate(update);
  });
}
