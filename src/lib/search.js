/* Tìm kiếm không phân biệt dấu nhưng phải giữ nguyên độ dài chuỗi, vì offset ký tự
   là toạ độ của tô sáng và của kết quả tìm. Vì thế gấp dấu theo từng ký tự, không gấp cả chuỗi
   (normalize('NFD') làm chuỗi dài ra). */

const COMBINING = /[\u0300-\u036f]/;

const lower = (ch) => {
  const l = ch.toLowerCase();
  return l.length === ch.length ? l : ch;
};

export function foldChar(ch) {
  if (ch === 'đ') return 'd';
  if (ch === 'Đ') return 'D';
  const stripped = Array.from(ch.normalize('NFD'), (c) => (COMBINING.test(c) ? '' : c)).join('');
  return stripped.length === 1 ? lower(stripped) : lower(ch);
}

export const fold = (s) => Array.from(s, foldChar).join('');

const cache = new Map();

function texts(chapter, exact) {
  const key = `${chapter.id}|${exact ? 1 : 0}`;
  if (!cache.has(key)) {
    cache.set(key, chapter.blocks.map((b) => (exact ? b.text.toLowerCase() : fold(b.text))));
  }
  return cache.get(key);
}

const SNIPPET = 48;

export function searchIn(chapters, query, { exact = false, limit = 200 } = {}) {
  const needle = (exact ? query.toLowerCase() : fold(query)).trim();
  if (needle.length < 2) return [];

  const hits = [];
  for (const chapter of chapters) {
    if (!chapter) continue;
    const haystacks = texts(chapter, exact);
    for (let block = 0; block < haystacks.length && hits.length < limit; block += 1) {
      const hay = haystacks[block];
      if (!hay) continue;
      let at = hay.indexOf(needle);
      while (at >= 0 && hits.length < limit) {
        hits.push(hit(chapter.id, block, at, needle.length, chapter.blocks[block].text));
        at = hay.indexOf(needle, at + needle.length);
      }
    }
    if (hits.length >= limit) break;
  }
  return hits;
}

function hit(chapterId, block, start, length, text) {
  const cut = Math.max(0, start - SNIPPET);
  const tail = Math.min(text.length, start + length + SNIPPET);
  return {
    chapterId,
    block,
    start,
    end: start + length,
    pre: text.slice(cut, start),
    hit: text.slice(start, start + length),
    post: text.slice(start + length, tail),
    lead: cut > 0,
    trail: tail < text.length,
  };
}
