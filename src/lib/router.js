import { useEffect, useState } from 'react';

/* GitHub Pages phục vụ dist tĩnh nên deep link chỉ đi được bằng hash.
   Hash rỗng hoặc không thuộc /doc/ thì app giữ nguyên luồng quiz. */

const DOC = /^#doc\/([a-z0-9-]+)(?:\/(\d+))?$/;
const GUIDE = /^#guide(?:\/([a-z0-9-]+))?$/;
const SUBMIT = /^#nop-bai(?:\/(\d+)(?:\/([\w.-]+))?)?$/;
const TONGHOP = /^#tong-hop$/;

export function parseHash(hash) {
  const m = DOC.exec(hash || '');
  if (m) return { kind: 'doc', chapterId: m[1], block: m[2] === undefined ? null : Number(m[2]) };
  const g = GUIDE.exec(hash || '');
  if (g) return { kind: 'guide', section: g[1] ?? null };
  const s = SUBMIT.exec(hash || '');
  if (s) return { kind: 'submit', bai: s[1] === undefined ? null : Number(s[1]), phan: s[2] ?? null };
  if (TONGHOP.exec(hash || '')) return { kind: 'tonghop' };
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

/* Điều hướng form nộp bài TH: không tham số → danh sách 5 bài; bai=1 kèm phan → form 1 phần. */
export function openSubmit(bai, phan) {
  const h = bai ? (phan ? `#nop-bai/${bai}/${phan}` : `#nop-bai/${bai}`) : '#nop-bai';
  if (window.location.hash === h) return;
  window.location.hash = h;
}

export function openTongHop() {
  if (window.location.hash === '#tong-hop') return;
  window.location.hash = '#tong-hop';
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
