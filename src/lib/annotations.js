import { useCallback, useEffect, useState } from 'react';
import { readKey, writeKey } from './store';

const MARKS_KEY = 'cncb-book.marks.v1';
const HL_KEY = 'cncb-book.hl.v1';

export const TONES = [
  { id: 'amber', label: 'Vàng', color: '#e0a71b' },
  { id: 'mint', label: 'Xanh lá', color: '#4fa06a' },
  { id: 'sky', label: 'Xanh dương', color: '#4b83b8' },
  { id: 'rose', label: 'Hồng', color: '#c9608c' },
];

export const DEFAULT_TONE = TONES[0].id;

export const toneColor = (id) => TONES.find((t) => t.id === id)?.color ?? TONES[0].color;

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function usePersistent(key, initial) {
  const [list, setList] = useState(() => {
    const stored = readKey(key, null);
    return Array.isArray(stored) ? stored : initial;
  });
  useEffect(() => {
    writeKey(key, list);
  }, [key, list]);
  return [list, setList];
}

export function useBookmarks(chapterId) {
  const [list, setList] = usePersistent(MARKS_KEY, []);

  const at = useCallback(
    (block) => list.find((m) => m.chapterId === chapterId && m.block === block),
    [chapterId, list],
  );

  const toggle = useCallback(
    (mark) => {
      const existing = list.find((m) => m.chapterId === chapterId && m.block === mark.block);
      if (existing) {
        setList((l) => l.filter((m) => m !== existing));
        return { added: false, mark: existing };
      }
      const created = { id: id(), createdAt: Date.now(), ...mark };
      setList((l) => [...l, created].sort((a, b) => a.createdAt - b.createdAt));
      return { added: true, mark: created };
    },
    [chapterId, list, setList],
  );

  const remove = useCallback((markId) => setList((l) => l.filter((m) => m.id !== markId)), [setList]);

  const update = useCallback(
    (markId, changes) => setList((l) => l.map((m) => (m.id === markId ? { ...m, ...changes } : m))),
    [setList],
  );

  return { list, at, toggle, remove, update };
}

export function useHighlights() {
  const [list, setList] = usePersistent(HL_KEY, []);

  const add = useCallback(
    (hl) => {
      const created = { id: id(), createdAt: Date.now(), updatedAt: Date.now(), ...hl };
      setList((l) => [...l, created]);
      return created;
    },
    [setList],
  );

  const update = useCallback(
    (hlId, patch) =>
      setList((l) => l.map((h) => (h.id === hlId ? { ...h, ...patch, updatedAt: Date.now() } : h))),
    [setList],
  );

  const remove = useCallback((hlId) => setList((l) => l.filter((h) => h.id !== hlId)), [setList]);

  const forChapter = useCallback((chapterId) => list.filter((h) => h.chapterId === chapterId), [list]);

  return { list, add, update, remove, forChapter };
}

/* Khoảng tô sáng của một khối, đã đổi sang toạ độ tuyệt đối trong block.text
   để bộ dựng run cắt chữ đúng chỗ. */
export function rangesFor(list, chapterId, block, extra = []) {
  const hits = list
    .filter((h) => h.chapterId === chapterId && h.block === block)
    .map((h) => ({ start: h.start, end: h.end, tone: h.tone, id: h.id, note: h.note }));
  return [...hits, ...extra].filter((r) => r.end > r.start);
}
