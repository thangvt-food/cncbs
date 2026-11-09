import { isAnswered, QUESTIONS } from '../lib/quiz';

const LEGEND = [
  { label: 'Chưa làm', style: {} },
  { label: 'Đã có đáp án', style: { background: 'color-mix(in oklab, var(--ink) 14%, var(--surface))' } },
  {
    label: 'Đã đánh dấu',
    style: { borderColor: 'var(--turmeric)', borderWidth: 2, backgroundImage: 'repeating-linear-gradient(-45deg, color-mix(in oklab, var(--turmeric) 55%, transparent) 0 2px, transparent 2px 5px)' },
  },
  { label: 'Câu đang xem', style: { outline: '2px solid var(--cinnabar)', outlineOffset: 1 } },
];

const LEGEND_RESULT = [
  { label: 'Đúng', style: { borderColor: 'var(--turmeric)', background: 'color-mix(in oklab, var(--turmeric) 26%, var(--surface))' } },
  {
    label: 'Sai',
    style: { background: 'color-mix(in oklab, var(--ink) 78%, var(--surface))', color: 'var(--on-ink)', borderStyle: 'dashed' },
  },
  { label: 'Bỏ trống', style: { borderStyle: 'dotted', color: 'transparent' } },
];

export function Navigator({ session, results, onJump, bare }) {
  const current = session.order[session.index];
  const grid = (
    <div className="nav-grid">
      {session.order.map((id, i) => {
        const q = QUESTIONS[id];
        const state = results ? undefined : isAnswered(session, q) ? 'answered' : undefined;
        const marked = session.marked.includes(id);
        const result = results?.[id];
        return (
          <button
            type="button"
            key={id}
            className="nav-cell"
            onClick={() => onJump(i)}
            data-state={marked ? 'marked' : state}
            data-current={id === current || undefined}
            data-result={result}
            aria-label={`Câu ${i + 1}${result ? ` — ${result === 'correct' ? 'đúng' : result === 'wrong' ? 'sai' : 'bỏ trống'}` : ''}${marked ? ' — đã đánh dấu' : ''}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
  const legend = (
    <div className="legend">
      {(results ? LEGEND_RESULT : LEGEND).map((l) => (
        <span className="legend__row" key={l.label}>
          <span className="legend__key" style={l.style} />
          {l.label}
        </span>
      ))}
    </div>
  );

  if (bare) {
    return (
      <>
        {grid}
        {legend}
      </>
    );
  }

  return (
    <div className="panel panel--nav">
      <h2 className="panel__title">{results ? 'Kết quả từng câu' : 'Danh sách câu'}</h2>
      {grid}
      {legend}
    </div>
  );
}
