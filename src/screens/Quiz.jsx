import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BANK_BY_ID,
  QUESTIONS,
  TYPE_META,
  fmtClock,
  grade,
  isAnswered,
} from '../lib/quiz';
import { Navigator } from '../components/Navigator';
import { Question } from '../components/Question';
import { Sheet } from '../components/Sheet';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid } from '../components/icons';

export function Quiz({ session, update, onFinish, pushToast }) {
  const [sheet, setSheet] = useState(null);
  const [journal, setJournal] = useState([]);
  const [announce, setAnnounce] = useState('');

  const bank = BANK_BY_ID[session.bankId];
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

  const railStats = (
    <div className="panel">
      <div className="stat">
        <span className="meta">Đã trả lời</span>
        <span className="stat__value">
          {answeredCount}
          <span className="score__unit">/{total}</span>
        </span>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={total}>
        <div className="meter__fill" style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>
      {session.mode === 'exam' && (
        <div className="stat">
          <span className="meta">
            <Clock width={16} height={16} /> Thời gian còn lại
          </span>
          <span className={`stat__value num${timed && remaining < 60 ? ' stat__value--warn' : ''}`}>
            {timed ? fmtClock(remaining * 1000) : fmtClock(session.usedSec * 1000)}
          </span>
        </div>
      )}
    </div>
  );

  const questionCard = (
    <article className="qcard" data-group={bank.group}>
      <header className="qcard__head">
        <span className="qcard__index">
          Câu {session.index + 1}
          <span className="score__unit"> / {total}</span>
        </span>
        <span className="chip">{TYPE_META[q.type].label}</span>
        <button
          type="button"
          className={`btn btn--ghost btn--sm qcard__flag${marked ? ' is-on' : ''}`}
          onClick={toggleMark}
          aria-pressed={marked}
        >
          <Flag width={16} height={16} />
          {marked ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </header>

      {q.text ? <h2 className="qcard__text">{q.text}</h2> : null}

      <Question q={q} value={value} onChange={setValue} reveal={reveal} />

      {verdict && (
        <p className="feedback" data-tone={verdict.correct ? 'correct' : 'wrong'}>
          {verdict.correct ? 'Đúng' : 'Chưa đúng'}
          {verdict.correct ? ' — ghi 1 điểm.' : ` — đáp án đúng là ${answerText(q)}.`}
        </p>
      )}

      <p className="hint">{TYPE_META[q.type].instruction}</p>

      <footer className="qcard__foot">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(session.index - 1)} disabled={session.index === 0}>
          <ChevronLeft width={16} height={16} /> Câu trước
        </button>
        <button type="button" className="btn btn--primary btn--nav" onClick={primaryAction}>
          {primaryLabel}
          {!isLast && <ChevronRight width={16} height={16} />}
        </button>
      </footer>
    </article>
  );

  return (
    <>
      <div className="wrap">
        <div className="quiz quiz--live">
          <aside className="rail rail-left">
            {railStats}
            <Navigator session={session} onJump={go} />
          </aside>
          <section className="stage">{questionCard}</section>
          <aside className="rail rail-right">
            <div className="panel">
              <h2 className="panel__title">Hành động</h2>
              <button type="button" className="btn btn--ghost btn--block" onClick={askSubmit}>
                Nộp bài
              </button>
              <p className="hint">
                Phím tắt: <kbd>1</kbd>–<kbd>4</kbd> chọn đáp án, <kbd>←</kbd> <kbd>→</kbd> chuyển câu,{' '}
                <kbd>M</kbd> đánh dấu, <kbd>Enter</kbd> câu tiếp theo.
              </p>
            </div>
            <div className="panel">
              <h2 className="panel__title">Nhật ký</h2>
              {journal.length === 0 ? (
                <p className="meta">Chưa có thao tác nào. Trả lời hoặc đánh dấu câu nào sẽ thấy ở đây.</p>
              ) : (
                <ul className="journal">
                  {journal.map((j) => (
                    <li key={j.id}>{j.text}</li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      <nav className="actionbar" aria-label="Điều hướng bài làm">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSheet('nav')}>
          <Grid width={16} height={16} />
          <span className="sr-only">Mở danh sách câu</span>
          <span aria-hidden="true" className="num">
            {session.index + 1}/{total}
          </span>
        </button>
        <button type="button" className="btn btn--primary" onClick={primaryAction}>
          {primaryLabel}
        </button>
      </nav>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <Sheet title="Danh sách câu" open={sheet === 'nav'} onClose={() => setSheet(null)}>
        <Navigator bare session={session} onJump={(i) => { go(i); setSheet(null); }} />
        {session.marked.length > 0 && (
          <p className="meta">
            Đã đánh dấu {session.marked.length} câu: {session.marked.map((id) => session.order.indexOf(id) + 1).join(', ')}
          </p>
        )}
        {journal.length > 0 && (
          <ul className="journal">
            {journal.map((j) => (
              <li key={j.id}>{j.text}</li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn--ghost btn--block" onClick={() => { setSheet(null); askSubmit(); }}>
          Nộp bài
        </button>
      </Sheet>

      <Sheet title="Nộp bài" open={sheet === 'submit'} onClose={() => setSheet(null)}>
        <p>
          {answeredCount < total
            ? `Bạn còn ${total - answeredCount} câu chưa trả lời. Nộp bài bây giờ sẽ tính những câu đó là sai.`
            : `Bạn đã trả lời đủ ${total} câu. Nộp bài để xem kết quả.`}
        </p>
        <div className="qcard__foot">
          <button type="button" className="btn btn--ghost" onClick={() => setSheet(null)}>
            Tiếp tục làm
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setSheet(null);
              onFinish('manual');
            }}
          >
            Nộp bài
          </button>
        </div>
      </Sheet>
    </>
  );
}

function toggleKey(value, key) {
  const list = value ?? [];
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

function answerText(q) {
  if (q.type === 'blanks') return q.blanks.map((b) => `${b.id}: ${b.answer}`).join(', ');
  return q.options
    .filter((o) => q.answers.includes(o.key))
    .map((o) => (q.type === 'true_false' ? o.text : `${o.key}: ${o.text}`))
    .join(', ');
}
