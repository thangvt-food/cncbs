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
import { BOOK, CHAPTERS, CHAPTER_BY_ID, nextChapterId, prevChapterId } from '../lib/book';
import { closeDoc } from '../lib/router';
import { TONES } from '../lib/annotations';
import { useReader } from './useReader';

const SHEET_TITLE = {
  toc: 'Mục lục',
  prefs: 'Cài đặt đọc',
  marks: 'Đánh dấu và ghi chú',
  search: 'Tìm trong tài liệu',
};

export function Reader({ route, pushToast }) {
  const reader = useReader({ route, pushToast });
  const {
    meta,
    chapterId,
    doc,
    sheet,
    rail,
    toc,
    chrome,
    dim,
    sel,
    tone,
    editing,
    query,
    exact,
    seek,
    results,
    pos,
    prefs,
    marks,
    hls,
    surfaceRef,
    rootRef,
    searchRef,
    patch,
    reset,
    jump,
    goChapter,
    turnPage,
    openSheet,
    closeSheet,
    toggleMark,
    highlightNow,
    annotateNow,
    copySelection,
    saveNote,
    decorate,
    openAnnotation,
    removeAnnotation,
    goToAnnotation,
    onSurfaceClick,
    setQuery,
    setExact,
    setSeek,
    chapterPct,
    wholePct,
    marked,
    rangesForBlock,
    compact,
  } = reader;

  if (!meta) return null;

  const prev = prevChapterId(chapterId);
  const next = nextChapterId(chapterId);
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
