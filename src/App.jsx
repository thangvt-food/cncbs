import { useCallback, useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Quiz } from './screens/Quiz';
import { Reader } from './screens/Reader';
import { Result } from './screens/Result';
import { Toasts } from './components/Toasts';
import { clearSession, loadSession, saveSession, useToasts } from './lib/hooks';
import { BANK_BY_ID, createSession } from './lib/quiz';
import { useHashRoute } from './lib/router';

export default function App() {
  const [session, setSession] = useState(null);
  const [draft, setDraft] = useState(() => loadSession());
  const { toasts, push, dismiss } = useToasts();
  const route = useHashRoute();

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

  const bank = session ? BANK_BY_ID[session.bankId] : null;
  /* Hash #doc/… là đường dẫn của tài liệu đọc: ưu tiên trước, luồng quiz không ghi hash
     nên hành vi cũ giữ nguyên. */
  const view = route ? 'reader' : !session ? 'home' : session.finishedAt ? 'result' : 'quiz';
  const position = session && !session.finishedAt ? session.index + 1 : 0;

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Nhảy tới nội dung
      </a>

      {!route && session && (
        <header className="masthead" data-group={bank.group}>
          <span className="masthead__brand">
            Luyện thi <span className="num">210339</span>
          </span>
          <span className="chip chip--solid">{bank.short}</span>
          <span className="masthead__spacer" />
          {view === 'quiz' && (
            <span className="chip num">
              Câu {position}/{session.order.length}
            </span>
          )}
          {view === 'result' && <span className="chip">Đã nộp</span>}
          <button type="button" className="btn btn--ghost btn--sm masthead__btn" onClick={exit}>
            {view === 'quiz' ? 'Thoát' : 'Chọn đề khác'}
          </button>
        </header>
      )}

      <main id="main" className="stack">
        {view === 'home' && (
          <div className="wrap">
            <Home onStart={start} resume={draft} onResume={() => setSession(draft)} />
          </div>
        )}
        {view === 'quiz' && (
          <Quiz session={session} update={update} onFinish={finish} pushToast={push} />
        )}
        {view === 'result' && <Result session={session} onRetry={retry} onHome={exit} />}
        {view === 'reader' && <Reader route={route} pushToast={push} />}
      </main>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
