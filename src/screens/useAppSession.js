import { useCallback, useEffect, useState } from 'react';
import { BANK_BY_ID, createSession } from '../lib/quiz';
import { clearSession, loadSession, saveSession, useToasts } from '../lib/hooks';

export function useAppSession() {
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState(() => loadSession());
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const update = useCallback((fn) => setSession((s) => fn(s)), []);

  const start = useCallback(
    (config) => {
      clearSession();
      setDraft(null);
      setSession(createSession(config));
      push(`Đã bắt đầu đề ${BANK_BY_ID[config.bankId].short}`);
    },
    [push],
  );

  const finish = useCallback(
    (reason) => {
      setSession((s) => (s.finishedAt ? s : { ...s, finishedAt: Date.now() }));
      push(reason === 'time' ? 'Hết giờ — bài đã được nộp.' : 'Đã nộp bài.');
    },
    [push],
  );

  const retry = useCallback(
    (ids) => {
      setSession((s) => ({
        ...createSession({ bankId: s.bankId, mode: 'practice', count: 0, shuffle: false, minutes: 0 }),
        order: ids,
        answers: {},
        marked: [],
      }));
      push(`Làm lại ${ids.length} câu. Chế độ luyện tập, có đáp án ngay.`);
    },
    [push],
  );

  const exit = useCallback(() => {
    setSession(null);
    setDraft(loadSession());
  }, []);

  return {
    session,
    draft,
    toasts,
    push,
    dismiss,
    update,
    start,
    finish,
    retry,
    exit,
  };
}
