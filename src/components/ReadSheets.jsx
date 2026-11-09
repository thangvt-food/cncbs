import { useState } from 'react';
import { BookOpen, Check, ChevronRight, Cross, Minus, Pen, Plus } from './icons';
import { ALIGNS, LINES, MEASURES, MODES, SIZE_MAX, SIZE_MIN, THEMES, lineHeightLabel } from '../lib/prefs';
import { FACES } from '../lib/fonts';
import { TONES, toneColor } from '../lib/annotations';
import { OfflineChip } from './OfflineChip';

/* Các bảng nội dung của màn đọc. Sheet (mobile/PC) và rail (PC) dùng chung một bộ,
   khác nhau mỗi thành phần là tên lớp của bọc ngoài. */

const chapterPart = (title) => {
  const i = title.indexOf('·');
  return i < 0 ? title : title.slice(i + 1).trim();
};

const day = (ts) => new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function TocList({ chapters, currentId, currentBlock, onPick }) {
  return (
    <div className="toc">
      {chapters.map((c) => {
        const entries = c.toc ?? [];
        const here = c.id === currentId;
        let active = -1;
        entries.forEach((e, i) => {
          if (here && e.block <= currentBlock) active = i;
        });
        return (
          <div className="toc__ch" key={c.id}>
            <button
              type="button"
              className="tocbtn tocbtn--ch"
              data-current={String(here && active < 0)}
              onClick={() => onPick(c.id, null)}
            >
              <BookOpen className="tocbtn__mark" width={16} height={16} />
              <span className="tocbtn__text">
                {c.short} — {chapterPart(c.title)}
              </span>
            </button>
            {entries.map((e, i) => (
              <button
                type="button"
                key={`${c.id}-${e.block}`}
                className={`tocbtn${e.lv > 1 ? ' tocbtn--lv2' : ''}`}
                data-current={String(active === i)}
                onClick={() => onPick(c.id, e.block)}
              >
                <BookOpen className="tocbtn__mark" width={16} height={16} />
                <span className="tocbtn__text">{e.text}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="prefs__row">
      <div className="prefs__head">
        <span className="prefs__label">{label}</span>
        {value != null && <span className="prefs__val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Options({ items, picked, onPick, label }) {
  return (
    <div className="opts" role="group" aria-label={label}>
      {items.map((it) => (
        <button
          type="button"
          key={it.id}
          className="optbtn"
          aria-pressed={picked === it.id}
          onClick={() => onPick(it.id)}
        >
          {it.swatch && (
            <span className="themecolour" style={{ '--swatch': it.swatch }} aria-hidden="true" />
          )}
          {it.label}
        </button>
      ))}
    </div>
  );
}

const THEME_SWATCH = { auto: 'linear-gradient(90deg,#fcfbf8 50%,#262c3a 0)', light: '#fcfbf8', paper: '#f3eadb', dark: '#262c3a' };

export function PrefsPanel({ prefs, patch, reset, defaultSize }) {
  const size = prefs.size ?? defaultSize;
  const step = (delta) => patch({ size: Math.min(SIZE_MAX, Math.max(SIZE_MIN, size + delta)) });
  const pct = ((size - SIZE_MIN) / (SIZE_MAX - SIZE_MIN)) * 100;

  return (
    <div className="prefs">
      <Row label="Cỡ chữ" value={`${size}px`}>
        <div className="stepper">
          <button type="button" className="rbtn" onClick={() => step(-1)} aria-label="Giảm cỡ chữ">
            <Minus />
          </button>
          <span className="stepper__bar" aria-hidden="true">
            <span className="stepper__fill" style={{ width: `${pct}%` }} />
          </span>
          <button type="button" className="rbtn" onClick={() => step(1)} aria-label="Tăng cỡ chữ">
            <Plus />
          </button>
        </div>
        {prefs.size == null && <p className="railnote">Đang dùng cỡ mặc định của màn hình.</p>}
      </Row>

      <Row label="Giãn dòng" value={lineHeightLabel(prefs.line)}>
        <Options
          label="Giãn dòng"
          items={LINES.map((v) => ({ id: v, label: lineHeightLabel(v) }))}
          picked={prefs.line}
          onPick={(v) => patch({ line: v })}
        />
      </Row>

      <Row label="Bề ngang cột chữ">
        <Options
          label="Bề ngang cột chữ"
          items={MEASURES.map((m) => ({ id: m.value, label: m.label }))}
          picked={prefs.measure}
          onPick={(v) => patch({ measure: v })}
        />
      </Row>

      <Row label="Chữ">
        <div className="prefs__faces">
          {FACES.map((f) => (
            <button
              type="button"
              key={f.id}
              className="facebtn"
              data-on={String(prefs.face === f.id)}
              aria-pressed={prefs.face === f.id}
              style={prefs.face === f.id ? { fontFamily: f.stack } : undefined}
              onClick={() => patch({ face: f.id })}
            >
              <span className="facebtn__name">{f.label}</span>
              <span className="facebtn__hint">
                {prefs.face === f.id ? <Check width={16} height={16} /> : f.hint}
              </span>
            </button>
          ))}
        </div>
      </Row>

      <Row label="Nền">
        <Options
          label="Nền"
          items={THEMES.map((t) => ({ ...t, swatch: THEME_SWATCH[t.id] }))}
          picked={prefs.theme}
          onPick={(v) => patch({ theme: v })}
        />
      </Row>

      <Row label="Căn lề">
        <Options
          label="Căn lề"
          items={ALIGNS}
          picked={prefs.align}
          onPick={(v) => patch({ align: v })}
        />
      </Row>

      <Row label="Cách đọc">
        <Options
          label="Cách đọc"
          items={MODES}
          picked={prefs.mode}
          onPick={(v) => patch({ mode: v })}
        />
      </Row>

      <div className="markrow">
        <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
          Về mặc định
        </button>
        <OfflineChip />
      </div>
    </div>
  );
}

function NoteEditor({ item, onCancel, onSave }) {
  const [note, setNote] = useState(item.note ?? '');
  const [tone, setTone] = useState(item.tone ?? TONES[0].id);

  return (
    <div className="notebox">
      <p className="mark__text">{item.text}</p>
      {item.kind === 'hl' && (
        <div className="tones" role="radiogroup" aria-label="Màu tô sáng">
          {TONES.map((t) => (
            <button
              type="button"
              key={t.id}
              className="tone"
              role="radio"
              aria-checked={tone === t.id}
              aria-label={t.label}
              style={{ '--tone': t.color }}
              onClick={() => setTone(t.id)}
            />
          ))}
        </div>
      )}
      <label className="prefs__label" htmlFor="note-input">
        Ghi chú
      </label>
      <textarea id="note-input" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      <div className="markrow">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => onSave({ note, tone })}>
          Lưu
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Huỷ
        </button>
      </div>
    </div>
  );
}

export function MarksPanel({ marks, highlights, editing, onEdit, onCloseEdit, onSaveNote, onGo, onRemove }) {
  if (editing) {
    return <NoteEditor item={editing} onCancel={onCloseEdit} onSave={onSaveNote} />;
  }

  const items = [
    ...marks.map((m) => ({ ...m, kind: 'mark' })),
    ...highlights,
  ].sort((a, b) => a.rank - b.rank || a.block - b.block || a.createdAt - b.createdAt);

  if (!items.length) {
    return (
      <p className="empty">
        Chưa có đánh dấu hay tô sáng nào. Chọn vài chữ trong bài để ghi chú, hoặc bấm nút Đánh dấu trên
        thanh dưới.
      </p>
    );
  }

  return (
    <div className="marks">
      {items.map((it) => (
        <div className="markrow" key={`${it.kind}-${it.id}`}>
          <button type="button" className="mark" onClick={() => onGo(it)}>
            <span className="mark__where">
              {it.kind === 'hl' && (
                <span className="themecolour" style={{ '--swatch': toneColor(it.tone) }} aria-hidden="true" />
              )}
              {it.chapterShort} · {day(it.createdAt)}
            </span>
            <span className="mark__text">{it.text}</span>
            {it.note && <span className="mark__note">{it.note}</span>}
          </button>
          <button type="button" className="rbtn" onClick={() => onEdit(it)} aria-label="Sửa ghi chú">
            <Pen width={18} height={18} />
          </button>
          <button
            type="button"
            className="rbtn"
            onClick={() => onRemove(it)}
            aria-label={it.kind === 'mark' ? 'Bỏ đánh dấu' : 'Bỏ tô sáng'}
          >
            <Cross width={18} height={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function SearchPanel({ inputRef, query, onQuery, exact, onExact, results, loading, chapters, onPick }) {
  const label = (id) => chapters[id]?.short ?? id;
  return (
    <div className="stack">
      <div className="searchrow">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Tìm trong tài liệu…"
          aria-label="Từ khoá tìm kiếm"
        />
        <button type="button" className="optbtn" aria-pressed={exact} onClick={onExact}>
          Đúng dấu
        </button>
      </div>
      <p className="searchmeta">
        <span>
          {loading
            ? `Đang nạp nội dung ${Object.keys(chapters).length} chương…`
            : query.trim().length < 2
              ? 'Gõ ít nhất hai chữ.'
              : `${results.length} kết quả${results.length >= 200 ? ' (đã giới hạn 200)' : ''}`}
        </span>
        <span className="railnote">Bỏ dấu tiếng Việt được tìm cả có dấu lẫn không dấu.</span>
      </p>
      <div className="hits">
        {results.map((h, i) => (
          <button type="button" className="hit" key={`${h.chapterId}-${h.block}-${h.start}`} onClick={() => onPick(h)}>
            <span className="hit__where">
              {label(h.chapterId)}
              <ChevronRight width={12} height={12} />
            </span>
            <span className="hit__text">
              {h.lead && '… '}
              {h.pre}
              <b>{h.hit}</b>
              {h.post}
              {h.trail && ' …'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
