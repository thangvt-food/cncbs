import { useSyncExternalStore } from 'react';

/* Trạng thái service worker + bản dựng: người dùng cần biết nội dung đã nằm trong máy
   để đọc offline, và cần biết máy đang chạy bản nào để không dính bản cũ. */

let state = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  cached: typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller),
  needRefresh: false,
  applying: false,
  version: __APP_VERSION__,
  build: __BUILD_STAMP__,
};

const listeners = new Set();
let updateHandler = null;
let registration = null;
let watching = false;
let lastCheck = 0;

export function setPwa(patch) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function usePwa() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

/* updateServiceWorker(true) của virtual:pwa-register: gửi SKIP_WAITING cho SW mới rồi
   để plugin tự reload khi SW mới nắm quyền. */
export function bindUpdate(fn) {
  updateHandler = fn;
}

export function applyUpdate() {
  if (!updateHandler || state.applying) return;
  setPwa({ applying: true, needRefresh: false });
  updateHandler(true);
}

export function deferUpdate() {
  setPwa({ needRefresh: false });
}

export function bindRegistration(reg) {
  registration = reg;
}

/* Máy điện thoại mở PWA hàng ngày mà không bao giờ điều hướng lại: nếu chỉ kiểm tra
   lúc mở thì bản cũ sống mãi. Kiểm tra lại mỗi lần app trở về foreground + định kỳ. */
export function checkForUpdate(force = false) {
  if (!registration) return;
  const now = Date.now();
  if (!force && now - lastCheck < 60_000) return;
  lastCheck = now;
  registration.update().catch(() => {});
}

export function startUpdateWatch() {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  window.setInterval(() => {
    if (document.visibilityState === 'visible') checkForUpdate();
  }, 5 * 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}
