import meta from '../data/book/index.json';

export const BOOK = meta.book;
export const CHAPTERS = BOOK.chapters;
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
export const TOTAL_WORDS = CHAPTERS.reduce((s, c) => s + c.words, 0) || 1;

export const CHAPTER_WORD_START = CHAPTERS.reduce((acc, c, i) => {
  acc[c.id] = i === 0 ? 0 : acc[CHAPTERS[i - 1].id] + CHAPTERS[i - 1].words;
  return acc;
}, {});

const loaders = Object.fromEntries(
  Object.entries(import.meta.glob('../data/book/ch*.json')).map(([path, load]) => [
    /(ch[^/]+)\.json$/.exec(path)[1],
    load,
  ]),
);

const requests = new Map();

/* Mỗi chương một file JSON riêng để chỉ nạp chương đang đọc, rồi nạp trước chương kế tiếp. */
export function loadChapter(id) {
  if (!requests.has(id)) {
    const load = loaders[id];
    if (!load) return Promise.reject(new Error(`Không có chương ${id}`));
    requests.set(
      id,
      load().then(
        (m) => prepare(m.default),
        (error) => {
          requests.delete(id);
          throw error;
        },
      ),
    );
  }
  return requests.get(id);
}

function prepare(chapter) {
  let words = 0;
  for (const b of chapter.blocks) {
    b.w0 = words;
    words += b.w;
  }
  chapter.words = words;
  chapter.blockCount = chapter.blocks.length;
  return chapter;
}

export const nextChapterId = (id) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 && i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].id : null;
};

export const prevChapterId = (id) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i > 0 ? CHAPTERS[i - 1].id : null;
};

const clamp01 = (n) => Math.min(1, Math.max(0, n || 0));

/* Tiến độ trong một chương tính theo số từ đã qua, không theo chỉ số khối:
   một bảng 20 dòng và một câu 12 chữ không đáng chiếm cùng một đoạn thanh tiến độ. */
export function chapterPercent(chapter, block, ratio) {
  const b = chapter?.blocks?.[block];
  if (!b || !chapter.words) return 0;
  return clamp01((b.w0 + b.w * clamp01(ratio)) / chapter.words);
}

export function bookFraction(chapterId, fraction) {
  const meta = CHAPTER_BY_ID[chapterId];
  if (!meta) return 0;
  return clamp01((CHAPTER_WORD_START[chapterId] + meta.words * clamp01(fraction)) / TOTAL_WORDS);
}

export function bookPercent(progress) {
  const done = CHAPTERS.reduce(
    (s, c) => s + c.words * clamp01(progress?.[c.id]?.percent),
    0,
  );
  return Math.round((done / TOTAL_WORDS) * 100);
}
