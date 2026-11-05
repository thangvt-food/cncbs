import { useState } from 'react';
import { BANKS, TYPE_META } from '../lib/quiz';

const COUNTS = [10, 20, 40, 0];
const MINUTES = [0, 15, 30, 45, 60, 90, 120];

const bankTotal = BANKS.reduce((n, b) => n + b.total, 0);

function typeBreakdown(bank) {
  const counts = {};
  bank.questions.forEach((q) => {
    counts[q.type] = (counts[q.type] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([t, n]) => `${n} ${TYPE_META[t].label.toLowerCase()}`)
    .join(' · ');
}

export function Home({ onStart, resume, onResume }) {
  const [bankId, setBankId] = useState(BANKS[0].id);
  const [mode, setMode] = useState('exam');
  const [count, setCount] = useState(0);
  const [minutes, setMinutes] = useState(45);
  const [shuffle, setShuffle] = useState(true);

  const bank = BANKS.find((b) => b.id === bankId);
  const size = count === 0 ? bank.total : Math.min(count, bank.total);

  const pickCount = (n) => {
    setCount(n);
    const b = BANKS.find((x) => x.id === bankId);
    const target = n === 0 ? b.total : Math.min(n, b.total);
    setMinutes(MINUTES.find((m) => m >= target) ?? 120);
  };

  return (
    <div className="home">
      <header className="home__lede">
        <h1>Luyện thi Chế biến Thực phẩm</h1>
        <p className="meta">
          {bankTotal} câu hỏi từ {BANKS.length} đề. Chọn đề, chọn chế độ rồi làm bài. Đáp án được chấm ngay khi nộp.
        </p>
      </header>

      {resume && (
        <div className="card card--sunken stack">
          <strong>{resume.finishedAt ? 'Bài đã nộp còn lưu trên máy này' : 'Bài làm chưa nộp còn lưu trên máy này'}</strong>
          <p className="meta">
            {BANKS.find((b) => b.id === resume.bankId)?.short ?? resume.bankId} ·{' '}
            {Object.keys(resume.answers ?? {}).length}/{resume.order.length} câu đã trả lời
          </p>
          <div>
            <button type="button" className="btn btn--ghost" onClick={onResume}>
              {resume.finishedAt ? 'Xem lại kết quả' : 'Tiếp tục bài đang làm'}
            </button>
          </div>
        </div>
      )}

      <section className="stack">
        <h2>Đề thi</h2>
        <div className="banklist">
          {BANKS.map((b) => (
            <button
              type="button"
              key={b.id}
              className="bankrow"
              data-group={b.group}
              data-selected={String(b.id === bankId)}
              aria-pressed={b.id === bankId}
              onClick={() => {
                setBankId(b.id);
                pickCount(count);
              }}
            >
              <span className="swatch" aria-hidden="true" />
              <span className="stack">
                <span className="bankrow__title">{b.title}</span>
                <span className="meta">{typeBreakdown(b)}</span>
              </span>
              <span className="bankrow__count">{b.total}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setup">
        <fieldset className="field" style={{ border: 0, padding: 0 }}>
          <legend>Chế độ</legend>
          <div className="segmented">
            <button
              type="button"
              className="btn"
              aria-pressed={mode === 'practice'}
              onClick={() => setMode('practice')}
            >
              Luyện tập
            </button>
            <button type="button" className="btn" aria-pressed={mode === 'exam'} onClick={() => setMode('exam')}>
              Thi thử
            </button>
          </div>
          <p className="meta">
            {mode === 'practice'
              ? 'Biết đúng sai ngay sau mỗi câu. Không giới hạn thời gian.'
              : 'Chỉ chấm khi nộp bài. Có đồng hồ đếm ngược.'}
          </p>
        </fieldset>

        <div className="field">
          <label htmlFor="count">Số câu</label>
          <select id="count" value={count} onChange={(e) => pickCount(Number(e.target.value))}>
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? `Toàn bộ đề (${bank.total} câu)` : `${Math.min(n, bank.total)} câu`}
              </option>
            ))}
          </select>
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
        </div>

        <div className="field">
          <span id="shuffle-label">Tuỳ chọn</span>
          <label className="switch" htmlFor="shuffle">
            <input
              id="shuffle"
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
            />
            Xáo trộn thứ tự câu hỏi
          </label>
        </div>
      </section>

      <div className="home__cta">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onStart({ bankId, mode, count: size, shuffle, minutes: mode === 'exam' ? minutes : 0 })}
        >
          Bắt đầu làm bài
        </button>
        <p className="hint">
          {size} câu · {mode === 'practice' ? 'Luyện tập' : minutes === 0 ? 'Không giới hạn thời gian' : `${minutes} phút`}
        </p>
      </div>
    </div>
  );
}
