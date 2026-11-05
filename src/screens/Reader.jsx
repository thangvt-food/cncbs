import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Block } from '../components/blocks';
import { Sheet } from '../components/Sheet';
import { MarksPanel, PrefsPanel, SearchPanel, TocList } from '../components/ReadSheets';
import {
  Bookmark,
  BookmarkFill,
  ChevronLeft,
  ChevronRight,
  List,
  Pen,
  Search,
} from '../components/icons';
import {
  BOOK,
  CHAPTERS,
  CHAPTER_BY_ID,
  bookFraction,
  loadChapter,
  nextChapterId,
  prevChapterId,
} from '../lib/book';
import { useReadingPosition } from '../lib/progress';
import { applyPrefs, usePrefs } from '../lib/prefs';
import { preloadFace } from '../lib/fonts';
import { DEFAULT_TONE, TONES, rangesFor, useBookmarks, useHighlights } from '../lib/annotations';
import { searchIn } from '../lib/search';
import { closeDoc, openDoc, replaceDoc } from '../lib/router';
import { useMediaQuery } from '../lib/hooks';

const SHEET_TITLE = {
  toc: 'Mục lục',
  prefs: 'Cài đặt đọc',
  marks: 'Đánh dấu và ghi chú',
  search: 'Tìm trong tài liệu',
};

const KEYS = { t: 'toc', a: 'prefs', b: 'marks', '/': 'search' };

/* Đổi màu thanh trạng thái của trình duyệt di động theo chủ đề đọc. */
const THEME_BAR = { light: '#fcfbf8', paper: '#f3eadb', dark: '#262c3a' };

const rankOf = (id) => CHAPTERS.findIndex((c) => c.id === id);

export function Reader({ route, pushToast }) {
  const meta = CHAPTER_BY_ID[route.chapterId] ?? null;
  const chapterId = meta?.id ?? null;

  const { prefs, patch, reset } = usePrefs();
  const compact = useMediaQuery('(max-width: 1023px)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [doc, setDoc] = useState(null);
  const [corpus, setCorpus] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [rail, setRail] = useState(false);
  const [toc, setToc] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [dim, setDim] = useState(false);
  const [sel, setSel] = useState(null);
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [exact, setExact] = useState(false);
  const [seek, setSeek] = useState(null);

  const surfaceRef = useRef(null);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const pageW = useRef(0);

  const marks = useBookmarks(chapterId);
  const hls = useHighlights();

  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => (corpus ? searchIn(corpus, deferredQuery, { exact }) : []),
    [corpus, deferredQuery, exact],
  );

  const { pos, ready, goTo, reposition, armReposition } = useReadingPosition({
    chapterId,
    chapter: doc,
    mode: prefs.mode,
    rootRef,
    targetBlock: route.block,
    paused: sheet !== null,
    onNotice: pushToast,
  });

  const behaviour = reduced ? 'auto' : 'smooth';
  const repositionRef = useRef(reposition);
  repositionRef.current = reposition;
  const armRef = useRef(armReposition);
  armRef.current = armReposition;

  /* Hash lạ (#doc/ch9) không có chương nào khớp: về chương đầu thay vì mở màn trống. */
  useEffect(() => {
    if (meta) return;
    openDoc(CHAPTERS[0].id);
    pushToast('Không có chương đó trong tài liệu này.');
  }, [meta, pushToast]);

  useEffect(() => {
    if (!chapterId) return undefined;
    let live = true;
    setDoc(null);
    setEditing(null);
    loadChapter(chapterId).then(
      (d) => {
        if (live) setDoc(d);
      },
      () => {
        if (live) pushToast('Không mở được chương này.');
      },
    );
    const next = nextChapterId(chapterId);
    const warm = setTimeout(() => {
      if (next) loadChapter(next).catch(() => {});
    }, 1600);
    return () => {
      live = false;
      clearTimeout(warm);
    };
  }, [chapterId, pushToast]);

  /* Cài đặt đọc áp lên chính màn đọc (attribute + biến CSS), không đụng phần quiz.
     Thay đổi làm layout dịch thì cuộn lại đúng khối đang đọc trước khi người dùng kịp thấy nhảy. */
  const geomKey = `${prefs.size}|${prefs.line}|${prefs.measure}|${prefs.face}|${prefs.mode}|${prefs.align}`;
  const geomRef = useRef(geomKey);
  useLayoutEffect(() => {
    applyPrefs(surfaceRef.current, prefs);
  }, [prefs]);

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colour = prefs.theme === 'auto' ? (dark ? THEME_BAR.dark : THEME_BAR.light) : THEME_BAR[prefs.theme];
    if (colour) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colour);
  }, [prefs.theme]);

  useEffect(() => {
    if (geomRef.current === geomKey) return;
    geomRef.current = geomKey;
    /* Chụp chỗ đọc ngay trong commit này: hàng đợi rAF của IntersectionObserver đã thấy
       bố cục mới nhưng chưa kịp ghi đè, để nó ghi là mất chỗ đọc. */
    armRef.current?.(null);
    (async () => {
      await preloadFace(prefs.face);
      await repositionRef.current?.();
    })();
  }, [geomKey, prefs.face]);

  /* Lật trang bằng CSS columns: một trang đúng bằng bề rộng khung chữ, tính lại mỗi khi khung đổi. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    if (prefs.mode !== 'paged') {
      el.style.removeProperty('--page-w');
      return undefined;
    }
    let last = -1;
    const measure = () => {
      const cs = getComputedStyle(el);
      const inner =
        el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      const w = Math.max(240, Math.floor(inner));
      if (w !== last) {
        last = w;
        el.style.setProperty('--page-w', `${w}px`);
      }
      pageW.current = w + (parseFloat(cs.columnGap) || 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [prefs.mode, doc]);

  useEffect(() => {
    if (!ready || !chapterId) return;
    replaceDoc(chapterId, pos.block);
  }, [ready, chapterId, pos.block]);

  useEffect(() => {
    if (compact) return undefined;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last + 8 && y > 120) setDim(true);
      else if (y < last - 8) setDim(false);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [compact]);

  useEffect(() => {
    if (!compact || pinned) return undefined;
    const hide = () => setChrome(false);
    const timer = setTimeout(hide, 2600);
    window.addEventListener('scroll', hide, { once: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', hide);
    };
  }, [compact, pinned, chapterId]);

  /* Vị trí chọn chữ -> toạ độ trong block.text, nhờ data-o trên từng mẩu text. */
  useEffect(() => {
    const onSelection = () => {
      const s = window.getSelection();
      if (!s || s.rangeCount === 0 || s.isCollapsed || !s.toString().trim()) {
        setSel(null);
        return;
      }
      const range = s.getRangeAt(0);
      const parent = (n) => (n && n.nodeType === 3 ? n.parentElement : n);
      const from = parent(range.startContainer)?.closest('[data-o]');
      const to = parent(range.endContainer)?.closest('[data-o]');
      const blockEl = from?.closest('[data-b]');
      if (!from || !blockEl) {
        setSel(null);
        return;
      }
      const block = Number(blockEl.dataset.b);
      const text = doc?.blocks?.[block]?.text ?? '';
      let start = Number(from.dataset.o) + range.startOffset;
      let end = to?.closest('[data-b]') === blockEl
        ? Number(to.dataset.o) + range.endOffset
        : text.length;
      if (end < start) [start, end] = [end, start];
      start = Math.max(0, Math.min(start, text.length));
      end = Math.max(start, Math.min(end, text.length));
      if (end === start) {
        setSel(null);
        return;
      }
      if (!to || to.closest('[data-b]') !== blockEl) {
        pushToast('Chỉ tô sáng được trong một đoạn — đã giữ phần thuộc đoạn này.');
      }
      const rect = range.getBoundingClientRect();
      setSel({
        block,
        start,
        end,
        text: s.toString().slice(0, 400),
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, [doc, pushToast]);

  const jump = useCallback(
    (block) => {
      if (block == null) return;
      goTo(block, 0, { behaviour });
    },
    [behaviour, goTo],
  );

  const goChapter = useCallback(
    (id, block = null) => {
      if (!id) return;
      if (id === chapterId) jump(block);
      else openDoc(id, block);
    },
    [chapterId, jump],
  );

  const turnPage = useCallback(
    (dir) => {
      const el = rootRef.current;
      if (!el || prefs.mode !== 'paged') return false;
      const step = pageW.current || el.clientWidth;
      const page = Math.round(el.scrollLeft / step);
      el.scrollTo({ left: (page + dir) * step, behavior: behaviour });
      return true;
    },
    [behaviour, prefs.mode],
  );

  const scrollScreen = useCallback(
    (dir) => {
      window.scrollTo({ top: window.scrollY + dir * window.innerHeight * 0.88, behavior: behaviour });
    },
    [behaviour],
  );

  const openSheet = useCallback(
    (which) => {
      if (!compact) {
        if (which === 'toc') return setToc((v) => !v);
        if (which === 'marks') return setRail((v) => !v);
      }
      if (which === 'search' && !corpus) {
        Promise.all(CHAPTERS.map((c) => loadChapter(c.id)))
          .then(setCorpus)
          .catch(() => pushToast('Chưa nạp được nội dung để tìm kiếm.'));
      }
      setSheet((s) => (s === which ? null : which));
    },
    [compact, corpus, pushToast],
  );

  const closeSheet = useCallback(() => {
    setSheet(null);
    setEditing(null);
  }, []);

  useEffect(() => {
    if (sheet === 'search') searchRef.current?.focus();
  }, [sheet]);

  const toggleMark = useCallback(() => {
    if (!chapterId || !doc) return;
    const b = doc.blocks[pos.block];
    const res = marks.toggle({
      chapterId,
      block: pos.block,
      text: (b?.text ?? '').slice(0, 160),
    });
    pushToast(res.added ? 'Đã đánh dấu trang' : 'Đã bỏ đánh dấu');
  }, [chapterId, doc, marks, pos.block, pushToast]);

  const addHighlight = useCallback(
    (changes = {}) => {
      if (!sel || !chapterId) return null;
      const created = hls.add({
        chapterId,
        block: sel.block,
        start: sel.start,
        end: sel.end,
        tone,
        note: '',
        text: sel.text,
        ...changes,
      });
      window.getSelection()?.removeAllRanges();
      setSel(null);
      return created;
    },
    [chapterId, hls, sel, tone],
  );

  const highlightNow = useCallback(() => {
    const created = addHighlight();
    if (created) pushToast('Đã tô sáng');
  }, [addHighlight, pushToast]);

  const annotateNow = useCallback(() => {
    const created = addHighlight();
    if (!created) return;
    setEditing({ ...created, kind: 'hl' });
    setSheet('marks');
  }, [addHighlight]);

  const copySelection = useCallback(() => {
    if (!sel) return;
    const text = sel.text;
    setSel(null);
    if (!navigator.clipboard?.writeText) {
      pushToast('Trình duyệt không cho chép — hãy chọn Chép từ menu');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => pushToast('Đã chép đoạn chọn'),
      () => pushToast('Không chép được đoạn chọn'),
    );
  }, [pushToast, sel]);

  const saveNote = useCallback(
    ({ note, tone: picked }) => {
      if (!editing) return;
      if (editing.kind === 'hl') hls.update(editing.id, { note, tone: picked });
      else marks.update(editing.id, { note });
      setEditing(null);
      pushToast('Đã lưu ghi chú');
    },
    [editing, hls, marks, pushToast],
  );

  const decorate = useCallback(
    (list, kind) =>
      list
        .filter((x) => CHAPTER_BY_ID[x.chapterId])
        .map((x) => ({
          ...x,
          kind,
          rank: rankOf(x.chapterId),
          chapterShort: CHAPTER_BY_ID[x.chapterId].short,
        }))
        .sort((a, b) => a.rank - b.rank || a.block - b.block),
    [],
  );

  const openAnnotation = useCallback(
    (item) => {
      setEditing(item);
      setSheet('marks');
    },
    [],
  );

  const removeAnnotation = useCallback(
    (item) => {
      if (item.kind === 'hl') hls.remove(item.id);
      else marks.remove(item.id);
      if (editing?.id === item.id) setEditing(null);
      pushToast(item.kind === 'hl' ? 'Đã bỏ tô sáng' : 'Đã bỏ đánh dấu');
    },
    [editing, hls, marks, pushToast],
  );

  const goToAnnotation = useCallback(
    (item) => {
      closeSheet();
      if (item.chapterId === chapterId) jump(item.block);
      else openDoc(item.chapterId, item.block);
    },
    [chapterId, closeSheet, jump],
  );

  const onSurfaceClick = useCallback(
    (e) => {
      const node = e.target.closest?.('mark[data-marks]');
      if (node) {
        const ids = node.dataset.marks.split(' ');
        const hit = hls.list.find((h) => ids.includes(h.id));
        if (!hit) return;
        openAnnotation({
          ...hit,
          kind: 'hl',
          rank: rankOf(hit.chapterId),
          chapterShort: CHAPTER_BY_ID[hit.chapterId]?.short,
        });
        return;
      }

      if (!e.detail || e.clientX === 0) return;
      if (e.target.closest('a, button, code, td, th')) return;
      const s = window.getSelection();
      if (s && !s.isCollapsed) return;
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      if (prefs.mode === 'paged' && x < 1 / 3) {
        turnPage(-1);
        return;
      }
      if (prefs.mode === 'paged' && x > 2 / 3) {
        turnPage(1);
        return;
      }
      if (compact) {
        setPinned(true);
        setChrome((c) => !c);
      }
    },
    [compact, hls.list, openAnnotation, prefs.mode, turnPage],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (sheet) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        if (turnPage(dir)) return;
        goChapter(dir > 0 ? nextChapterId(chapterId) : prevChapterId(chapterId));
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        if (!turnPage(dir)) scrollScreen(dir);
        return;
      }
      if (e.key === 'Escape') {
        if (sel) setSel(null);
        else if (rail) setRail(false);
        return;
      }
      const which = KEYS[e.key.toLowerCase()];
      if (!which) return;
      e.preventDefault();
      openSheet(which);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapterId, goChapter, openSheet, rail, scrollScreen, sel, sheet, turnPage]);

  const hitsByBlock = useMemo(() => {
    if (deferredQuery.trim().length < 2 || !results.length) return null;
    const map = new Map();
    for (const h of results) {
      if (h.chapterId !== chapterId) continue;
      if (!map.has(h.block)) map.set(h.block, []);
      map.get(h.block).push({ start: h.start, end: h.end, kind: 'hit' });
    }
    return map;
  }, [chapterId, deferredQuery, results]);

  const rangesForBlock = useCallback(
    (b) => rangesFor(hls.list, chapterId, b.n, hitsByBlock?.get(b.n) ?? []),
    [chapterId, hls.list, hitsByBlock],
  );

  if (!meta) return null;

  const chapterPct = Math.round(pos.percent * 100);
  const wholePct = Math.round(bookFraction(chapterId, pos.percent) * 100);
  const chapterNo = rankOf(chapterId) + 1;
  const prev = prevChapterId(chapterId);
  const next = nextChapterId(chapterId);
  const marked = marks.at(pos.block);
  const paged = prefs.mode === 'paged';
  const toneLabel = TONES.find((t) => t.id === tone)?.label ?? '';
  const marksPanel = (
    <MarksPanel
      marks={decorate(marks.list, 'mark')}
      highlights={decorate(hls.list, 'hl')}
      editing={editing}
      onEdit={openAnnotation}
      onCloseEdit={() => setEditing(null)}
      onSaveNote={saveNote}
      onGo={goToAnnotation}
      onRemove={removeAnnotation}
    />
  );

  return (
    <div className="reader" ref={surfaceRef} data-rail={rail ? 'on' : 'off'} data-toc={toc ? 'on' : 'off'}>
      <header
        className="rb rtop"
        data-hidden={String(compact && !chrome)}
        data-dim={String(!compact && dim)}
        onPointerEnter={() => setDim(false)}
      >
        <button type="button" className="rbtn" onClick={closeDoc} aria-label="Về trang luyện thi">
          <ChevronLeft />
        </button>
        <p className="rtitle">
          {meta.short} · <span className="num">{chapterPct}%</span>
          <span className="desk-only"> · {wholePct}% toàn tài liệu</span>
        </p>
        <button type="button" className="rbtn" onClick={() => openSheet('search')} aria-label="Tìm trong tài liệu">
          <Search />
        </button>
        <button
          type="button"
          className="rbtn"
          onClick={toggleMark}
          aria-label={marked ? 'Bỏ đánh dấu trang' : 'Đánh dấu trang này'}
          aria-pressed={Boolean(marked)}
        >
          {marked ? <BookmarkFill /> : <Bookmark />}
        </button>
        <button type="button" className="rbtn desk-only" onClick={() => openSheet('toc')} aria-label="Mục lục" aria-pressed={toc}>
          <List />
        </button>
        <button
          type="button"
          className="rbtn desk-only rbtn--aa"
          onClick={() => openSheet('prefs')}
          aria-label="Cài đặt đọc"
        >
          Aa
        </button>
        <button type="button" className="rbtn desk-only" onClick={() => openSheet('marks')} aria-label="Đánh dấu và ghi chú" aria-pressed={rail}>
          <Pen />
        </button>
      </header>

      <div className="reader__body">
        <nav className="rail rail--start" aria-label="Mục lục">
          <p className="rail__title">Mục lục</p>
          <TocList chapters={CHAPTERS} currentId={chapterId} currentBlock={pos.block} onPick={goChapter} />
        </nav>

        <article className="reader__text" ref={rootRef} onClick={onSurfaceClick}>
          <h1 className="rchap">{meta.title}</h1>
          <p className="rbyline">
            {BOOK.author} · {meta.words.toLocaleString('vi-VN')} từ
          </p>

          {doc ? (
            <>
              {doc.blocks.map((b) => (
                <Block key={b.n} b={b} ranges={rangesForBlock(b)} />
              ))}
              <footer className="rfoot">
                {prev && (
                  <button type="button" className="rbtn" onClick={() => goChapter(prev)}>
                    <ChevronLeft width={16} height={16} />
                    Chương trước
                  </button>
                )}
                {next ? (
                  <button type="button" className="rbtn rbtn--cta" onClick={() => goChapter(next)}>
                    Chương tiếp
                    <ChevronRight width={16} height={16} />
                  </button>
                ) : (
                  <span className="railnote">Chương cuối của tài liệu.</span>
                )}
              </footer>
            </>
          ) : (
            <p className="rbyline">Đang mở {meta.short.toLowerCase()}…</p>
          )}
        </article>

        {rail && !compact && (
          <aside className="rail rail--end" aria-label="Đánh dấu và ghi chú">
            <p className="rail__title">Đánh dấu và ghi chú</p>
            {marksPanel}
          </aside>
        )}
      </div>

      <footer className="rb rbottom" data-hidden={String(compact && !chrome)}>
        {paged && (
          <>
            <button type="button" className="rbtn rpage" onClick={() => turnPage(-1)} aria-label="Trang trước">
              <ChevronLeft />
            </button>
            <button type="button" className="rbtn rpage" onClick={() => turnPage(1)} aria-label="Trang sau">
              <ChevronRight />
            </button>
          </>
        )}
        <input
          className="rseek"
          type="range"
          min={0}
          max={Math.max(0, meta.blockCount - 1)}
          value={seek ?? pos.block}
          onPointerUp={() => {
            if (seek != null) jump(seek);
            setSeek(null);
          }}
          onBlur={() => {
            if (seek != null) jump(seek);
            setSeek(null);
          }}
          onChange={(e) => setSeek(Number(e.target.value))}
          aria-label={`Tiến độ đọc ${meta.short}: ${chapterPct}%`}
        />
        <span className="rread num">{wholePct}%</span>
        <button type="button" className="rbtn" onClick={() => openSheet('toc')} aria-label="Mở mục lục">
          <List />
        </button>
        <button type="button" className="rbtn rbtn--aa" onClick={() => openSheet('prefs')} aria-label="Cài đặt đọc">
          Aa
        </button>
        <button type="button" className="rbtn" onClick={() => openSheet('marks')} aria-label="Đánh dấu và ghi chú">
          <Pen />
        </button>
      </footer>

      {sel && (
        <div
          className="selbar"
          role="group"
          aria-label="Chọn chữ"
          style={{
            top: Math.max(56, sel.top - 8),
            left: Math.min(window.innerWidth - 120, Math.max(120, sel.left)),
          }}
        >
          <button type="button" className="rbtn" onClick={highlightNow}>
            Tô sáng {toneLabel}
          </button>
          <button type="button" className="rbtn" onClick={annotateNow}>
            Ghi chú
          </button>
          <button type="button" className="rbtn" onClick={copySelection}>
            Chép
          </button>
        </div>
      )}

      <Sheet title={SHEET_TITLE.toc} open={sheet === 'toc'} onClose={closeSheet}>
        <TocList chapters={CHAPTERS} currentId={chapterId} currentBlock={pos.block} onPick={goChapter} />
      </Sheet>

      <Sheet title={SHEET_TITLE.prefs} open={sheet === 'prefs'} onClose={closeSheet}>
        <PrefsPanel
          prefs={prefs}
          patch={patch}
          reset={reset}
          defaultSize={compact ? 18 : 19}
        />
        <p className="railnote" style={{ marginTop: 'var(--sp-4)' }}>
          Phím tắt: ← → chuyển chương hoặc lật trang, Space cuộn một màn, T mục lục, Aa cài đặt, B đánh
          dấu, / tìm, Esc đóng.
        </p>
      </Sheet>

      <Sheet title={SHEET_TITLE.marks} open={sheet === 'marks'} onClose={closeSheet}>
        {marksPanel}
      </Sheet>

      <Sheet title={SHEET_TITLE.search} open={sheet === 'search'} onClose={closeSheet}>
        <SearchPanel
          inputRef={searchRef}
          query={query}
          onQuery={setQuery}
          exact={exact}
          onExact={() => setExact((v) => !v)}
          results={results}
          loading={!corpus}
          chapters={CHAPTER_BY_ID}
          onPick={(h) => {
            closeSheet();
            goChapter(h.chapterId, h.block);
          }}
        />
      </Sheet>
    </div>
  );
}
