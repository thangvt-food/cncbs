import { Home } from './screens/Home';
import { Quiz } from './screens/Quiz';
import { Reader } from './screens/Reader';
import { Result } from './screens/Result';
import { PracticeGuide } from './screens/PracticeGuide';
import { Toasts } from './components/Toasts';
import { useHashRoute } from './lib/router';
import { useAppSession } from './screens/useAppSession';

export default function App() {
  const { session, draft, toasts, push, dismiss, update, start, finish, retry, exit } = useAppSession();
  const route = useHashRoute();

  const bank = session ? BANK_BY_ID[session.bankId] : null;
  /* Hash #doc/… là đường dẫn của tài liệu đọc: ưu tiên trước, luồng quiz không ghi hash
     nên hành vi cũ giữ nguyên. */
  const view =
    route?.kind === 'doc'
      ? 'reader'
      : route?.kind === 'guide'
        ? 'guide'
        : !session
          ? 'home'
          : session.finishedAt
            ? 'result'
            : 'quiz';
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
        {view === 'guide' && <PracticeGuide route={route} pushToast={push} />}
      </main>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
