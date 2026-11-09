import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUESTIONS, fmtClock, grade, isAnswered } from '../lib/quiz';

export function useQuiz({ session, update, onFinish, pushToast }) {
  const [sheet, setSheet] = useState(null);
  const [journal, setJournal] = useState([]);
  const [announce, setAnnounce] = useState('');

  const bankId = session.bankId;
  const qid = session.order[session.index];
  const q = QUESTIONS[qid];
  const value = session.answers[qid];
  const total = session.order.length;
  const answeredCount = useMemo(
    () => session.order.filter((id) => isAnswered(session, QUESTIONS[id])).length,
    [session],
  );
  const isLast = session.index === total - 1;
  const reveal = session.mode === 'practice' && isAnswered(session, q);
  const timed = session.mode === 'exam' && session.durationSec > 0;
  const remaining = session.durationSec - session.usedSec;
  const marked = session.marked.includes(qid);

  const note = useCallback((text, key) => {
    setJournal((j) => {
      const rest = key ? j.filter((x) => x.key !== key) : j;
      return [{ id: Date.now() + Math.random(), key, text }, ...rest].slice(0, 20);
    });
  }, []);

  const go = useCallback(
    (index) => {
      const next = Math.max(0, Math.min(total - 1, index));
      update((s) => ({ ...s, index: next }));
    },
    [total, update],
  );

  const setValue = useCallback(
    (next) => {
      update((s) => ({ ...s, answers: { ...s.answers, [qid]: next } }));
      const picked = Array.isArray(next) ? next : Object.values(next ?? {}).filter(Boolean);
      if (!picked.length) return;
      setAnnounce(
        session.mode === 'practice'
          ? `${grade(q, next).correct ? 'Đúng' : 'Chưa đúng'} — đáp án: ${answerText(q)}.`
          : `Đã ghi đáp án câu ${session.index + 1}.`,
      );
      note(`Đã trả lời câu ${session.index + 1}`, `answer-${session.index}`);
    },
    [note, q, qid, session.index, session.mode, update],
  );

  const toggleMark = useCallback(() => {
    update((s) => ({
      ...s,
      marked: s.marked.includes(qid) ? s.marked.filter((x) => x !== qid) : [...s.marked, qid],
    }));
    note(marked ? `Bỏ đánh dấu câu ${session.index + 1}` : `Đã đánh dấu câu ${session.index + 1}`, `mark-${session.index}`);
    pushToast(marked ? `Bỏ đánh dấu câu ${session.index + 1}` : `Đã đánh dấu câu ${session.index + 1}`);
  }, [marked, note, pushToast, qid, session.index, update]);

  const askSubmit = useCallback(() => setSheet('submit'), []);

  useEffect(() => {
    if (!timed) return undefined;
    const t = setInterval(() => {
      if (session.usedSec + 1 >= session.durationSec) {
        update((s) => ({ ...s, usedSec: s.durationSec }));
        onFinish('time');
      } else {
        update((s) => ({ ...s, usedSec: s.usedSec + 1 }));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [timed, session.usedSec, session.durationSec, update, onFinish]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || sheet) return;
      const tag = e.target?.tagName;
      if (tag === 'SELECT' || tag === 'TEXTAREA') return;

      const digit = Number(e.key);
      if (tag !== 'INPUT' && Number.isInteger(digit) && digit >= 1 && digit <= (q.options?.length ?? 0)) {
        e.preventDefault();
        const key = q.options[digit - 1].key ?? String.fromCharCode(65 + digit - 1);
        setValue(q.type === 'multi' ? toggleKey(value, key) : [key]);
        return;
      }
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && tag !== 'BUTTON')) {
        e.preventDefault();
        if (isLast) askSubmit();
        else go(session.index + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(session.index - 1);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMark();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [askSubmit, go, isLast, q, session.index, sheet, setValue, toggleMark, value]);

  const verdict = reveal ? grade(q, value) : null;
  const primaryLabel = isLast ? 'Nộp bài' : 'Câu tiếp theo';
  const primaryAction = isLast ? askSubmit : () => go(session.index + 1);

  return {
    // State
    sheet,
    journal,
    announce,
    qid,
    q,
    value,
    total,
    answeredCount,
    isLast,
    reveal,
    timed,
    remaining,
    marked,
    verdict,
    primaryLabel,
    primaryAction,
    
    // Actions
    setSheet,
    go,
    setValue,
    toggleMark,
    askSubmit,
    note,
  };
}

function toggleKey(value, key) {
  const list = value ?? [];
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

export function answerText(q) {
  if (q.type === 'blanks') return q.blanks.map((b) => `${b.id}: ${b.answer}`).join(', ');
  return q.options
    .filter((o) => q.answers.includes(o.key))
    .map((o) => (q.type === 'true_false' ? o.text : `${o.key}: ${o.text}`))
    .join(', ');
}
