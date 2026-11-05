import { useState } from 'react';
import { BANK_BY_ID, QUESTIONS, TYPE_META, fmtMinutes, grade, isAnswered, summarize } from '../lib/quiz';
import { Navigator } from '../components/Navigator';
import { Question } from '../components/Question';
import { Sheet } from '../components/Sheet';
import { Check, Cross, Minus } from '../components/icons';
import { useMediaQuery } from '../lib/hooks';

export function Result({ session, onRetry, onHome }) {
  const [openId, setOpenId] = useState(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const bank = BANK_BY_ID[session.bankId];
  const s = summarize(session);
  const percent = Math.round(s.score * 100);

  const results = Object.fromEntries(
    session.order.map((id) => {
      const q = QUESTIONS[id];
      if (!isAnswered(session, q)) return [id, 'skip'];
      return [id, grade(q, session.answers[id]).correct ? 'correct' : 'wrong'];
    }),
  );

  const wrongIds = session.order.filter((id) => results[id] !== 'correct');
  const open = openId ? QUESTIONS[openId] : null;
  const detail = open && (
    <div className="stack">
      <div className="qcard__head">
        <span className="qcard__index">Câu {session.order.indexOf(open.id) + 1}</span>
        <span className="chip">{TYPE_META[open.type].label}</span>
        <span className={`badge`} data-tone={results[open.id]}>
          {results[open.id] === 'correct' ? <Check width={16} height={16} /> : results[open.id] === 'wrong' ? <Cross width={16} height={16} /> : <Minus width={16} height={16} />}
          {results[open.id] === 'correct' ? 'Đúng' : results[open.id] === 'wrong' ? 'Sai' : 'Bỏ trống'}
        </span>
      </div>
      {open.text ? <h2 className="qcard__text">{open.text}</h2> : null}
      <Question q={open} value={session.answers[open.id]} onChange={() => {}} reveal disabled />
    </div>
  );

  return (
    <div className="wrap">
      <div className="quiz quiz--result">
        <aside className="rail rail-left">
          <div className="panel" data-group={bank.group}>
            <h2 className="panel__title">Điểm</h2>
            <div className="score">
              <span className="score__value">{percent}</span>
              <span className="score__meta">
                <span>%</span>
                <span>{s.correct}/{s.total} câu đúng</span>
              </span>
            </div>
            <p className="meta">{bank.title}</p>
            <p className="meta">
              {session.mode === 'exam' ? 'Chế độ thi thử' : 'Chế độ luyện tập'} · làm trong{' '}
              {fmtMinutes(s.timeUsedMs)}
            </p>
          </div>
          <div className="panel">
            <h2 className="panel__title">Chi tiết</h2>
            <div className="bars">
              <Stat tone="correct" label="Đúng" value={s.correct} total={s.total} />
              <Stat tone="wrong" label="Sai" value={s.wrong} total={s.total} />
              <Stat tone="skip" label="Bỏ trống" value={s.blank} total={s.total} />
            </div>
          </div>
        </aside>

        <section className="stage stack">
          <h1>{percent >= 80 ? 'Kết quả tốt' : percent >= 50 ? 'Cần làm lại vài câu' : 'Còn nhiều câu chưa đúng'}</h1>
          <p className="meta">Bấm vào từng câu để xem đáp án và phần bạn đã chọn.</p>

          <div className="review">
            {session.order.map((id, i) => {
              const q = QUESTIONS[id];
              const tone = results[id];
              return (
                <button
                  type="button"
                  className="reviewrow"
                  key={id}
                  onClick={() => setOpenId(id)}
                  aria-expanded={openId === id}
                  aria-label={`Xem chi tiết câu ${i + 1}`}
                >
                  <span className="reviewrow__idx">{i + 1}</span>
                  <span className="reviewrow__text">{q.text || q.passage}</span>
                  <span className="badge" data-tone={tone}>
                    {tone === 'correct' ? <Check width={16} height={16} /> : tone === 'wrong' ? <Cross width={16} height={16} /> : <Minus width={16} height={16} />}
                    {tone === 'correct' ? 'Đúng' : tone === 'wrong' ? 'Sai' : 'Bỏ trống'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="qcard__foot">
            <button type="button" className="btn btn--ghost" onClick={onHome}>
              Về trang chọn đề
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={wrongIds.length === 0}
              onClick={() => onRetry(wrongIds)}
            >
              {wrongIds.length ? `Làm lại ${wrongIds.length} câu sai` : 'Đúng hết, không cần làm lại'}
            </button>
          </div>
        </section>

        <aside className="rail rail-right">
          {open && wide ? (
            <div className="panel">
              <h2 className="panel__title">Chi tiết câu</h2>
              {detail}
            </div>
          ) : (
            <Navigator session={session} results={results} onJump={(i) => setOpenId(session.order[i])} />
          )}
          <div className="panel">
            <h2 className="panel__title">Theo loại câu</h2>
            <div className="bars">
              {s.byType.map((t) => (
                <div key={t.id}>
                  <div className="bar__top">
                    <span>{t.label}</span>
                    <span className="num">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                  <div className="meter">
                    <div className="meter__fill" style={{ width: `${(t.correct / t.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Sheet title={open ? `Câu ${session.order.indexOf(open.id) + 1}` : ''} open={Boolean(open) && !wide} onClose={() => setOpenId(null)}>
        {detail}
      </Sheet>
    </div>
  );
}

function Stat({ tone, label, value, total }) {
  return (
    <div>
      <div className="bar__top">
        <span>{label}</span>
        <span className="num">
          {value}
          <span className="score__unit">/{total}</span>
        </span>
      </div>
      <div className="meter">
        <div className="meter__fill" data-tone={tone} style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  );
}
