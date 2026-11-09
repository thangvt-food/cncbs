import { BANK_BY_ID, TYPE_META, fmtClock } from '../lib/quiz';
import { Navigator } from '../components/Navigator';
import { Question } from '../components/Question';
import { Sheet } from '../components/Sheet';
import { ChevronLeft, ChevronRight, Clock, Flag, Grid } from '../components/icons';
import { useQuiz, answerText } from './useQuiz';

export function Quiz({ session, update, onFinish, pushToast }) {
  const quiz = useQuiz({ session, update, onFinish, pushToast });
  const {
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
    setSheet,
    go,
    setValue,
    toggleMark,
    askSubmit,
  } = quiz;

  const bank = BANK_BY_ID[session.bankId];

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

