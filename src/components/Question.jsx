import { optionVerdict, TYPE_META } from '../lib/quiz';
import { Check, Cross } from './icons';

function Choice({ q, value, onChange, reveal, disabled }) {
  const multi = q.type === 'multi';

  const toggle = (key) => {
    if (!multi) return onChange([key]);
    const has = value?.includes(key);
    onChange(has ? value.filter((k) => k !== key) : [...(value ?? []), key]);
  };

  return (
    <fieldset className="options">
      <legend className="sr-only">{TYPE_META[q.type].instruction}</legend>
      {q.options.map((opt, i) => {
        const key = opt.key ?? String.fromCharCode(65 + i);
        const letter = q.type === 'true_false' ? opt.text.trim().charAt(0) : key;
        const checked = Boolean(value?.includes(key));
        const v = optionVerdict(q, value, key);
        const shown = reveal && v ? (v === 'wrong' ? 'wrong' : 'correct') : undefined;
        const tag =
          v === 'wrong' ? 'Bạn đã chọn' : v === 'missed' ? 'Đáp án đúng' : checked ? 'Đúng' : null;
        return (
          <label className="opt" key={key} data-checked={checked} data-verdict={shown}>
            <input
              className="opt__input"
              type={multi ? 'checkbox' : 'radio'}
              name={q.id}
              value={key}
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(key)}
            />
            <span className="opt__key num" aria-hidden="true">
              {letter}
            </span>
            <span className="opt__body">{opt.text}</span>
            {shown ? (
              <span className="opt__mark">
                {shown === 'wrong' ? <Cross width={16} height={16} /> : <Check width={16} height={16} />}
                {tag}
              </span>
            ) : (
              <span className="opt__mark" aria-hidden="true" />
            )}
          </label>
        );
      })}
    </fieldset>
  );
}

function Blanks({ q, value, onChange, reveal, disabled }) {
  const current = value ?? {};
  const parts = String(q.passage ?? q.text).split(/\((\d+)\)\s*\./);
  const nodes = [];
  parts.forEach((part, i) => {
    if (i % 2 === 0) {
      const text = part?.replace(/^\.+\s*/, '');
      if (text) nodes.push(text);
      return;
    }
    const blank = q.blanks.find((b) => String(b.id) === part);
    if (!blank) return;
    const chosen = current[blank.id];
    const verdict = reveal ? (chosen ? (chosen === blank.answer ? 'correct' : 'wrong') : 'missed') : null;
    nodes.push(
      <span className="blank" key={blank.id} data-verdict={verdict}>
        <label className="sr-only" htmlFor={`blank-${blank.id}`}>
          Chỗ trống {blank.id}
        </label>
        <select
          id={`blank-${blank.id}`}
          value={chosen ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...current, [blank.id]: e.target.value })}
        >
          <option value="">—</option>
          {q.pool.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {verdict && verdict !== 'correct' ? (
          <span className="meta"> &nbsp;đúng: {blank.answer}</span>
        ) : null}
      </span>,
    );
  });

  return <p className="blanks__passage">{nodes}</p>;
}

export function Question({ q, value, onChange, reveal, disabled }) {
  if (q.type === 'blanks') return <Blanks q={q} value={value} onChange={onChange} reveal={reveal} disabled={disabled} />;
  return <Choice q={q} value={value} onChange={onChange} reveal={reveal} disabled={disabled} />;
}
