import { useState } from 'react';
import { BANKS, TYPE_META } from '../lib/quiz';
import { Check } from '../components/icons';
import { OfflineChip } from '../components/OfflineChip';
import { CHAPTERS, TOTAL_WORDS, bookPercent } from '../lib/book';
import { readProgress } from '../lib/progress';
import { openDoc, openGuide } from '../lib/router';
import { usePwa } from '../lib/pwa';

const COUNTS = [10, 20, 40, 0];
const MINUTES = [0, 15, 30, 45, 60, 90, 120];
const MODES = [
  { id: 'practice', name: 'Luyện tập', desc: 'Báo đúng sai ngay sau mỗi câu' },
  { id: 'exam', name: 'Thi thử', desc: 'Chấm khi nộp bài, có đồng hồ đếm ngược' },
];

const bankTotal = BANKS.reduce((n, b) => n + b.total, 0);

function typeChips(bank) {
  const counts = {};
  bank.questions.forEach((q) => {
    counts[q.type] = (counts[q.type] ?? 0) + 1;
  });
  return Object.entries(counts).map(([t, n]) => ({
    id: t,
    text: `${n} ${TYPE_META[t].label.toLowerCase()}`,
  }));
}

function Reading() {
  const { last, at } = readProgress();
  const overall = bookPercent(at);
  const lastChapter = last ? CHAPTERS.find((c) => c.id === last) : null;
  const atLast = last ? at[last] : null;

  return (
    <section className="reading">
      <div className="reading__head">
        <h2>Tài liệu đọc</h2>
        <p className="meta">
          {CHAPTERS.length} chương tổng hợp lý thuyết · {TOTAL_WORDS.toLocaleString('vi-VN')} từ
          {overall > 0 && <> · đã đọc <span className="num">{overall}%</span></>}
        </p>
      </div>

      {lastChapter && (
        <button type="button" className="btn btn--primary reading__go" onClick={() => openDoc(last)}>
          Đọc tiếp {lastChapter.short} · {Math.round((atLast?.percent ?? 0) * 100)}%
        </button>
      )}

      <div className="readlist">
        {CHAPTERS.map((c) => {
          const pct = Math.round((at[c.id]?.percent ?? 0) * 100);
          return (
            <button type="button" key={c.id} className="readrow" onClick={() => openDoc(c.id)}>
              <span className="readrow__title">{c.title}</span>
              <span className="readrow__meter" aria-hidden="true">
                <span className="meter__fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="num readrow__pct">{pct}%</span>
            </button>
          );
        })}
      </div>
      <OfflineChip className="reading__off" />
    </section>
  );
}

export function Home({ onStart, resume, onResume }) {
  const [bankId, setBankId] = useState(BANKS[0].id);
  const [mode, setMode] = useState('exam');
  const [count, setCount] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [shuffle, setShuffle] = useState(true);
  const { version, build } = usePwa();

  const bank = BANKS.find((b) => b.id === bankId);
  const size = count === 0 ? bank.total : Math.min(count, bank.total);
  const timed = mode === 'exam' && minutes > 0;

  const pickCount = (n, id = bankId) => {
    setCount(n);
    const b = BANKS.find((x) => x.id === id);
    const target = n === 0 ? b.total : Math.min(n, b.total);
    setMinutes(MINUTES.find((m) => m >= target) ?? 120);
  };

  const moveCount = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (COUNTS.indexOf(count) + step + COUNTS.length) % COUNTS.length;
    pickCount(COUNTS[next]);
    event.currentTarget.querySelectorAll('[role="radio"]')[next].focus();
  };

  const answered = resume ? Object.keys(resume.answers ?? {}).length : 0;

  const ticket = (
    <>
      <p className="ticket__num-row">
        <span className="ticket__stat">
          <span className="num ticket__value">{size}</span>
          <span className="ticket__unit">câu</span>
        </span>
        <span className="ticket__stat">
          {timed ? (
            <>
              <span className="num ticket__value">{minutes}</span>
              <span className="ticket__unit">phút</span>
            </>
          ) : (
            <span className="num ticket__value ticket__value--word">Không giới hạn</span>
          )}
        </span>
      </p>
      <p className="meta">
        {mode === 'practice' ? 'Chế độ luyện tập' : 'Chế độ thi thử'} · {bank.short}
      </p>
    </>
  );

  return (
    <div className="home">
      <header className="home__lede">
        <h1>Công nghệ Chế biến Sữa</h1>
        <p className="home__code">
          Mã học phần <span className="num">210339</span>
        </p>
        <p className="home__intro">
          {bankTotal} câu hỏi từ {BANKS.length} đề. Luyện tập báo đúng sai sau mỗi câu, Thi thử chấm khi nộp bài.
        </p>
      </header>

      {resume && (
        <div className="resume">
          <div className="resume__head">
            <h2>{resume.finishedAt ? 'Kết quả bài gần nhất' : 'Bạn đang làm dở một bài'}</h2>
            <p className="resume__note">Lưu trên máy này</p>
          </div>
          <p className="meta">
            {BANKS.find((b) => b.id === resume.bankId)?.short ?? resume.bankId} · đã trả lời{' '}
            <span className="num">
              {answered}/{resume.order.length}
            </span>{' '}
            câu
          </p>
          <div className="meter resume__meter">
            <div className="meter__fill" style={{ width: `${(answered / resume.order.length) * 100}%` }} />
          </div>
          <div>
            <button type="button" className="btn btn--light" onClick={onResume}>
              {resume.finishedAt ? 'Xem lại kết quả' : 'Tiếp tục bài đang làm'}
            </button>
          </div>
        </div>
      )}

      <Reading />

      <section className="practice-guide-cta">
        <div className="practice-guide-cta__body">
          <h2>Hướng dẫn thực hành ở xưởng</h2>
          <p className="meta">
            Quy trình chi tiết 4 nội dung thực hành (kiểm nghiệm sữa tươi, sữa chua, kem tươi, kem caramel), công
            thức mẫu, đánh giá cảm quan và báo cáo.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => openGuide()}>
          Mở hướng dẫn
        </button>
      </section>

      <div className="home__cols">
        <section className="home__col stack">
          <h2 className="step">
            <span className="step__num num">1</span>
            Chọn đề
          </h2>
          <div className="banklist">
            {BANKS.map((b) => {
              const selected = b.id === bankId;
              return (
                <button
                  type="button"
                  key={b.id}
                  className="bankrow"
                  data-group={b.group}
                  data-selected={String(selected)}
                  aria-pressed={selected}
                  onClick={() => {
                    setBankId(b.id);
                    pickCount(count, b.id);
                  }}
                >
                  <span className="bankrow__lead">
                    <span className="swatch" aria-hidden="true" />
                    <span className="bankrow__tick" data-on={String(selected)} aria-hidden="true">
                      <Check width={13} height={13} />
                    </span>
                  </span>
                  <span className="bankrow__main">
                    <span className="bankrow__title">{b.title}</span>
                    <span className="bankrow__chips">
                      {typeChips(b).map((c) => (
                        <span className="chip chip--tiny" key={c.id}>
                          {c.text}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="bankrow__count">
                    <span className="num">{b.total}</span>
                    <span className="bankrow__count-unit">câu</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="home__col stack">
          <div className="ticket">
            <div className="ticket__perf" aria-hidden="true" />
            <p className="ticket__label">Tóm tắt</p>
            {ticket}
            <button
              type="button"
              className="btn btn--primary btn--block ticket__cta"
              onClick={() =>
                onStart({ bankId, mode, count: size, shuffle, minutes: mode === 'exam' ? minutes : 0 })
              }
            >
              Bắt đầu làm bài
            </button>
          </div>

          <h2 className="step">
            <span className="step__num num">2</span>
            Chế độ
          </h2>
          <div className="modes">
            {MODES.map((m) => (
              <button
                type="button"
                key={m.id}
                className="mode"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                <span className="mode__top">
                  {m.name}
                  <span className="mode__tick" data-on={String(mode === m.id)} aria-hidden="true">
                    <Check width={12} height={12} />
                  </span>
                </span>
                <span className="mode__desc">{m.desc}</span>
              </button>
            ))}
          </div>

          <h2 className="step">
            <span className="step__num num">3</span>
            Thiết lập
          </h2>
          <div className="panel setup">
            <div className="field">
              <span className="field__label" id="count-label">
                Số câu
              </span>
              <div
                className="chips"
                role="radiogroup"
                aria-labelledby="count-label"
                onKeyDown={moveCount}
              >
                {COUNTS.map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    className="pick"
                    aria-checked={count === n}
                    tabIndex={count === n ? 0 : -1}
                    onClick={() => pickCount(n)}
                  >
                    {n === 0 ? `Toàn bộ (${bank.total})` : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="minutes">Thời gian làm bài</label>
              <select
                id="minutes"
                value={minutes}
                disabled={mode === 'practice'}
                onChange={(e) => setMinutes(Number(e.target.value))}
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'Không giới hạn' : `${m} phút`}
                  </option>
                ))}
              </select>
              {mode === 'practice' && <p className="field__note">Chỉ áp dụng cho Thi thử</p>}
            </div>

            <div className="field">
              <label htmlFor="shuffle" className="switch">
                <input
                  id="shuffle"
                  type="checkbox"
                  role="switch"
                  aria-checked={shuffle}
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__text">Xáo trộn thứ tự câu hỏi</span>
              </label>
            </div>
          </div>
        </section>
      </div>

      <div className="actionbar home__bar">
        <p className="home__bar-sum">
          <span className="num">{size}</span> câu, {mode === 'practice' ? 'Luyện tập' : 'Thi thử'}
          {timed ? (
            <>
              , <span className="num">{minutes}</span> phút
            </>
          ) : (
            ', không giới hạn'
          )}
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() =>
            onStart({ bankId, mode, count: size, shuffle, minutes: mode === 'exam' ? minutes : 0 })
          }
        >
          Bắt đầu làm bài
        </button>
      </div>

      <p className="home__ver">
        Bản dựng <span className="num">{build}</span> · v{version}
      </p>
    </div>
  );
}
