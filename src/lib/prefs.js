import { useCallback, useEffect, useState } from 'react';
import { readKey, writeKey } from './store';
import { faceById } from './fonts';

const KEY = 'cncb-book.prefs.v1';

export const SIZE_MIN = 14;
export const SIZE_MAX = 28;
export const LINES = [1.5, 1.65, 1.8];
export const MEASURES = [
  { value: 45, label: 'Hẹp' },
  { value: 55, label: 'Vừa' },
  { value: 66, label: 'Rộng' },
];
export const THEMES = [
  { id: 'auto', label: 'Theo máy' },
  { id: 'light', label: 'Sáng' },
  { id: 'paper', label: 'Giấy' },
  { id: 'dark', label: 'Tối' },
];
export const ALIGNS = [
  { id: 'left', label: 'Trái' },
  { id: 'justify', label: 'Đều hai bên' },
];
export const MODES = [
  { id: 'scroll', label: 'Cuộn dọc' },
  { id: 'paged', label: 'Lật trang' },
];

/* size = null nghĩa là "chưa chọn", để CSS quyết định 18px mobile / 19px PC theo khuyến nghị đọc. */
export const DEFAULT_PREFS = {
  size: null,
  line: 1.65,
  measure: 66,
  face: 'literata',
  theme: 'auto',
  align: 'left',
  mode: 'scroll',
};

export function readPrefs() {
  return { ...DEFAULT_PREFS, ...readKey(KEY, {}) };
}

export function applyPrefs(el, prefs) {
  if (!el) return;
  el.dataset.theme = prefs.theme;
  el.dataset.align = prefs.align;
  el.dataset.mode = prefs.mode;
  el.style.setProperty('--read-line', String(prefs.line));
  el.style.setProperty('--read-measure', `${prefs.measure}ch`);
  el.style.setProperty('--font-reading', faceById(prefs.face).stack);
  if (prefs.size) el.style.setProperty('--read-size', `${prefs.size}px`);
  else el.style.removeProperty('--read-size');
  el.style.colorScheme = prefs.theme === 'auto' ? 'light dark' : prefs.theme === 'dark' ? 'dark' : 'light';
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    writeKey(KEY, prefs);
  }, [prefs]);

  const patch = useCallback((next) => setPrefs((p) => ({ ...p, ...next })), []);
  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), []);

  return { prefs, patch, reset };
}

export function lineHeightLabel(value) {
  return String(value).replace('.', ',');
}
