import { useSyncExternalStore } from 'react';

/* Trạng thái service worker chỉ có ý nghĩa một lần: người dùng cần biết nội dung đã nằm
   trong máy để đọc lúc mất mạng, không cần biểu đồ cài đặt. */

let state = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  cached: typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller),
};

const listeners = new Set();

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
