import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const pkg = createRequire(import.meta.url)('./package.json');

/* Mỗi lần deploy có một mã bản dựng riêng (ngày + commit) để trên máy người dùng
   đối chiếu được bản đang chạy với bản mới trên mạng. */
function buildStamp() {
  let sha = process.env.GITHUB_SHA ?? '';
  if (!sha) {
    try {
      sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
    } catch {
      sha = '';
    }
  }
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return [day, sha.slice(0, 7)].filter(Boolean).join('.');
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_STAMP__: JSON.stringify(buildStamp()),
  },
  plugins: [
    react(),
    VitePWA({
      /* Chế độ prompt: bản mới tải xong sẽ chờ, app tự áp khi vừa mở hoặc hỏi người dùng
         khi đang dùng dở — không reload giữa lúc làm bài, không kẹt mãi ở bản cũ. */
      registerType: 'prompt',
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
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173, host: true },
});
