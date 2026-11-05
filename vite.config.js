import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Luyện thi Công nghệ Chế biến Sữa',
        short_name: 'CB Sữa',
        description:
          'Web luyện thi môn Công nghệ Chế biến Sữa (210339): 160 câu hỏi từ 3 đề, chế độ luyện tập và thi thử, kèm tài liệu đọc cả học phần offline.',
        lang: 'vi',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fcfbf8',
        theme_color: '#2c6b66',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        /* Nội dung sách nằm trong JSON, font nằm trong woff2: thiếu một trong hai là offline
           chỉ còn khung giao diện. */
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2,json}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, host: true },
});
