import { useCallback, useEffect, useRef, useState } from 'react';
import { BANK_BY_ID } from './quiz';

const KEY = 'cncb-quiz.session.v1';

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    const session = raw ? JSON.parse(raw) : null;
    const bank = session && BANK_BY_ID[session.bankId];
    // Đề bị gỡ khỏi ngân hàng sau khi lưu: bỏ bản nháp thay vì mở màn hình trống.
    if (!bank || !session.order.every((id) => bank.questions.some((q) => q.id === id))) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* bộ nhớ đầy hoặc chế độ ẩn danh: mất bản nháp, bài vẫn chơi được */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (text) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, text }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );
  return { toasts, push, dismiss };
}

export function useTicker(active, onTick) {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => cb.current(), 1000);
    return () => clearInterval(t);
  }, [active]);
}
