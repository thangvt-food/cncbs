import { useEffect, useState } from 'react';

/* GitHub Pages phục vụ dist tĩnh nên deep link chỉ đi được bằng hash.
   Hash rỗng hoặc không thuộc /doc/ thì app giữ nguyên luồng quiz. */

const DOC = /^#doc\/([a-z0-9-]+)(?:\/(\d+))?$/;
const GUIDE = /^#guide(?:\/([a-z0-9-]+))?$/;

export function parseHash(hash) {
  const m = DOC.exec(hash || '');
  if (m) return { kind: 'doc', chapterId: m[1], block: m[2] === undefined ? null : Number(m[2]) };
  const g = GUIDE.exec(hash || '');
  if (g) return { kind: 'guide', section: g[1] ?? null };
  return null;
}

export function docHash(chapterId, block) {
  return block === null || block === undefined ? `#doc/${chapterId}` : `#doc/${chapterId}/${block}`;
}

export function useHashRoute() {
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseHash(hash);
}

/* Điều hướng tới một chương: tạo history entry để nút Back của trình duyệt về lại chỗ cũ. */
export function openDoc(chapterId, block) {
  if (window.location.hash === docHash(chapterId, block)) return;
  window.location.hash = docHash(chapterId, block);
}

/* Điều hướng tới mục hướng dẫn thực hành. */
export function openGuide(section) {
  const h = section ? `#guide/${section}` : '#guide';
  if (window.location.hash === h) return;
  window.location.hash = h;
}

/* Ghi vị trí đọc đang xem mà không chất thêm history entry. */
export function replaceDoc(chapterId, block) {
  const url = `${window.location.pathname}${window.location.search}${docHash(chapterId, block)}`;
  window.history.replaceState(null, '', url);
}

export function closeDoc() {
  const url = `${window.location.pathname}${window.location.search}`;
  window.history.pushState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
