import { useCallback, useEffect, useRef, useState } from 'react';
import { readKey, writeKey } from './store';
import { chapterPercent } from './book';

const KEY = 'cncb-book.progress.v1';

/* Không bao giờ lưu số trang — số trang đổi khi đổi cỡ chữ, xoay màn hình, đổi thiết bị.
   Vị trí đọc là {chương, chỉ số khối, phần đã qua của khối đó}. */

export function readProgress() {
  const raw = readKey(KEY, null);
  return { last: raw?.last ?? null, at: raw?.at ?? {} };
}

function writeEntry(rec, chapterId, entry) {
  const next = { v: 1, last: chapterId, at: { ...rec.at, [chapterId]: entry } };
  writeKey(KEY, next);
  return next;
}

const clamp01 = (n) => Math.min(1, Math.max(0, n || 0));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/* Chờ bố cục thôi dịch: webfont về trễ đẩy khối xuống, bảng co giãn sau khi kịp tính cột. */
export function layoutSettle(el, { quiet = 140, max = 1200 } = {}) {
  return new Promise((resolve) => {
    if (!el || typeof ResizeObserver === 'undefined') {
      resolve();
      return;
    }
    let last = 0;
    let calm = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      ro.disconnect();
      clearTimeout(calm);
      clearTimeout(hardStop);
      resolve();
    };
    const ro = new ResizeObserver(() => {
      const height = el.offsetHeight;
      if (height === last) return;
      last = height;
      clearTimeout(calm);
      calm = setTimeout(finish, quiet);
    });
    const hardStop = setTimeout(finish, max);
    last = el.offsetHeight;
    calm = setTimeout(finish, quiet);
    ro.observe(el);
  });
}

export async function fontsSettle() {
  if (!document.fonts) return;
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]);
}

/* Hai chế độ đọc dùng chung một mô hình vị trí, chỉ khác trục: cuộn dọc đọc theo trục Y
   của tài liệu, lật trang đọc theo trục X của khung trang. */
function geometry(mode, root) {
  if (mode === 'paged') {
    /* Không dùng offsetLeft: nó tính theo offsetParent (có thể là một tổ tiên được định vị nào đó)
       chứ không tính theo vùng cuộn, và nó tính cả padding trong khi scrollLeft lại đo từ mép trong
       của padding. Mọi phép đo quy về getBoundingClientRect của chính khung cuộn. */
    const rr = root.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(root).paddingLeft) || 0;
    const origin = rr.left + padL;
    return {
      axis: 'x',
      scroll: () => root.scrollLeft,
      viewport: () => root.clientWidth,
      line: 0,
      start: (el) => el.getBoundingClientRect().left - origin + root.scrollLeft,
      size: (el) => el.offsetWidth,
      cross: (el) => el.getBoundingClientRect().top,
      to: (value, behavior) => root.scrollTo({ left: value, behavior }),
    };
  }
  return {
    axis: 'y',
    scroll: () => window.scrollY,
    viewport: () => window.innerHeight,
    line: Math.min(200, Math.max(56, window.innerHeight * 0.3)),
    start: (el) => el.getBoundingClientRect().top + window.scrollY,
    size: (el) => el.offsetHeight,
    cross: () => 0,
    to: (value, behavior) => window.scrollTo({ top: value, behavior }),
  };
}

export function useReadingPosition({ chapterId, chapter, mode, rootRef, targetBlock, paused, onNotice }) {
  const [pos, setPos] = useState({ block: 0, ratio: 0, percent: 0 });
  const [ready, setReady] = useState(false);

  const rec = useRef(readProgress());
  const posRef = useRef(pos);
  const readyRef = useRef(false);
  const pausedRef = useRef(false);
  const dirty = useRef(false);
  const raf = useRef(0);
  const timer = useRef(0);
  const resize = useRef(0);
  const actions = useRef(null);
  const keepPos = useRef(null);
  const suppressUntil = useRef(0);

  readyRef.current = ready;
  pausedRef.current = paused;
  const busy = () => !readyRef.current || pausedRef.current;

  const blocksOf = useCallback(
    () => (rootRef.current ? [...rootRef.current.querySelectorAll('[data-b]')] : []),
    [rootRef],
  );

  const save = useCallback(
    (block, ratio, percent) => {
      if (!chapterId || !chapter) return;
      rec.current = writeEntry(rec.current, chapterId, {
        block,
        ratio: Math.round(ratio * 1000) / 1000,
        percent: Math.round(percent * 1000) / 1000,
        blockCount: chapter.blockCount,
        ts: Date.now(),
      });
    },
    [chapterId, chapter],
  );

  const scheduleSave = useCallback(
    (block, ratio, percent) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => save(block, ratio, percent), 1000);
    },
    [save],
  );

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const { block, ratio, percent } = posRef.current;
    save(block, ratio, percent);
  }, [save]);

  const apply = useCallback(
    (next) => {
      const percent = chapterPercent(chapter, next.block, next.ratio);
      const before = posRef.current;
      posRef.current = { ...next, percent };
      setPos(posRef.current);
      if (before.block !== next.block || Math.abs(before.percent - percent) >= 0.005) {
        scheduleSave(next.block, next.ratio, percent);
      }
    },
    [chapter, scheduleSave],
  );

  const capture = useCallback(() => {
    const root = rootRef.current;
    if (!root) return null;
    const g = geometry(mode, root);
    const els = blocksOf();
    if (!els.length) return null;

    const line = g.scroll() + g.line;
    const far = g.scroll() + g.viewport();
    let pick = null;
    let passed = null;

    for (const el of els) {
      const start = g.start(el);
      const size = g.size(el);
      if (start + size <= line) {
        passed = { el, start, size };
        continue;
      }
      if (start >= far) continue;
      if (
        !pick ||
        start < pick.start ||
        (start === pick.start && g.cross(el) < g.cross(pick.el))
      ) {
        pick = { el, start, size };
      }
    }

    const chosen = pick ?? passed ?? {
      el: els[els.length - 1],
      start: g.start(els[els.length - 1]),
      size: g.size(els[els.length - 1]),
    };
    const ratio = g.axis === 'x' ? 0 : clamp01((line - chosen.start) / (chosen.size || 1));
    return { block: Number(chosen.el.dataset.b), ratio };
  }, [blocksOf, mode, rootRef]);

  const refresh = useCallback(() => {
    dirty.current = true;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      dirty.current = false;
      if (busy() || performance.now() < suppressUntil.current) return;
      const found = capture();
      if (found) apply(found);
    });
  }, [apply, capture]);

  const goTo = useCallback(
    async (block, ratio = 0, { behavior = 'auto' } = {}) => {
      const root = rootRef.current;
      if (!root || !chapter) return;
      const g = geometry(mode, root);
      suppressUntil.current = performance.now() + 500;

      for (let pass = 0; pass < 4; pass += 1) {
        const el = root.querySelector(`[data-b="${block}"]`);
        if (!el) break;
        const before = g.start(el);
        const offset = g.axis === 'x' ? 0 : el.offsetHeight * clamp01(ratio) - g.line;
        g.to(before + offset, behavior);
        await nextFrame();
        if (Math.abs(g.start(el) - before) < 1) break;
      }

      suppressUntil.current = performance.now() + 250;
      apply({ block, ratio });
    },
    [apply, chapter, mode, rootRef],
  );

  /* Chụp lại chỗ đọc *trước* khi bố cục kịp dịch, rồi tắt máy đo một nhịp. Nếu bỏ bước này,
     IntersectionObserver bắn ngay sau reflow và ghi đè chỗ đọc bằng đoạn đang lọt vào dải đo
     ở cùng số cuộn — xoay máy xong là mất chỗ đọc mà không hề cuộn. */
  const armReposition = useCallback((delay = 240) => {
    keepPos.current = { block: posRef.current.block, ratio: posRef.current.ratio };
    suppressUntil.current = performance.now() + 6000;
    clearTimeout(resize.current);
    if (delay !== null) resize.current = setTimeout(() => actions.current?.reposition(), delay);
  }, []);

  /* Mở sách: về đúng đoạn đang đọc dở. Chờ font và bố cục đứng lại trước khi cuộn,
     rồi cuộn lại nếu khối vẫn dịch (webfont về trễ) — tối đa 4 lần. */
  useEffect(() => {
    if (!chapter || !chapterId) return undefined;
    const abort = new AbortController();
    setReady(false);
    clearTimeout(resize.current);
    keepPos.current = null;

    (async () => {
      await fontsSettle();
      await layoutSettle(rootRef.current);
      if (abort.signal.aborted) return;

      const stored = rec.current.at[chapterId];
      let block = targetBlock ?? stored?.block ?? 0;
      let ratio = targetBlock == null ? stored?.ratio ?? 0 : 0;
      if (block >= chapter.blockCount) {
        block = Math.max(0, chapter.blockCount - 1);
        ratio = 0;
        onNotice?.('Vị trí cũ không còn trong bản cập nhật — đã về khối cuối của chương.');
      }
      await goTo(block, ratio);
      if (abort.signal.aborted) return;
      /* Ghi ngay một lần: mở chương nào cũng đủ để trang chủ biết đọc dở chỗ nào,
         kể cả khi người dùng chưa cuộn tới đâu. */
      save(block, ratio, chapterPercent(chapter, block, ratio));
      setReady(true);
    })();

    return () => {
      abort.abort();
      clearTimeout(timer.current);
      clearTimeout(resize.current);
      keepPos.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, chapterId, targetBlock]);

  useEffect(() => {
    const root = rootRef.current;
    if (!chapter || !root) return undefined;
    const els = blocksOf();
    if (!els.length) return undefined;

    const io = new IntersectionObserver(() => refresh(), {
      root: mode === 'paged' ? root : null,
      threshold: 0,
    });
    els.forEach((el) => io.observe(el));

    let lastWidth = window.innerWidth;
    const onScroll = () => refresh();
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      root.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, chapterId, mode, refresh, flush, blocksOf]);

  /* Đổi bề ngang (xoay máy, kéo lại cửa sổ) làm bố cục reflow: cùng số cuộn nhưng đã thành
     đoạn khác, nên việc phải làm là cuộn lại theo {block, ratio} đã lưu chứ không đo tiếp.
     Only a height change (Safari collapsing its address bar) is safe to just re-measure.
     Listener sống ở effect riêng để việc đổi chương không ngắt nhịp chờ bố cục ổn định. */
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) {
        refresh();
        return;
      }
      lastWidth = window.innerWidth;
      if (!readyRef.current || !chapter) return;
      armReposition();
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [armReposition, chapter, refresh]);

  /* Đổi cỡ chữ, giãn dòng, font, bề ngang cột hoặc chế độ đọc: vị trí tính theo khối nên
     không mất chỗ đọc — chỉ cần để bố cục ổn định rồi cuộn lại theo hình học mới. */
  const reposition = useCallback(async () => {
    if (!readyRef.current) {
      keepPos.current = null;
      return;
    }
    const target = keepPos.current ?? posRef.current;
    keepPos.current = null;
    await fontsSettle();
    await layoutSettle(rootRef.current);
    if (readyRef.current) await goTo(target.block, target.ratio);
  }, [goTo, rootRef]);

  actions.current = { reposition };

  return { pos, ready, goTo, refresh, reposition, armReposition, flush };
}
