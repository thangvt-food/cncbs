import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(root, 'data/sources/book');
const outDir = resolve(root, 'src/data/book');

const BOOK = {
  id: 'cncbs-ly-thuyet',
  title: 'Công nghệ Chế biến Sữa — Tổng hợp lý thuyết',
  author: 'GV Lê Trung Thiên · ĐH Nông Lâm TP.HCM',
  note: 'Tổng hợp từ phụ đề playlist “Công nghệ Chế biến Sữa”, kênh DrThienNonglam',
};

const SOURCES = [
  { id: 'ch1', file: 'tong-hop-chuong-1-cong-nghe-che-bien-sua.md', title: 'Mở đầu — sản xuất và tiêu thụ sữa' },
  { id: 'ch2', file: 'tong-hop-chuong-2-cong-nghe-che-bien-sua.md', title: 'Cấu trúc, thành phần và sinh tổng hợp sữa' },
  { id: 'ch3', file: 'tong-hop-chuong-3-cong-nghe-che-bien-sua.md', title: 'Các cấu phần hoá học của sữa' },
  { id: 'ch4', file: 'tong-hop-chuong-4-cong-nghe-che-bien-sua.md', title: 'Tính chất vật lý và hoá lý của sữa' },
  { id: 'ch5', file: 'tong-hop-chuong-5-cong-nghe-che-bien-sua.md', title: 'Vi sinh vật học sữa' },
  { id: 'ch6', file: 'tong-hop-chuong-6-cong-nghe-che-bien-sua.md', title: 'Các quá trình chế biến cơ bản của sữa' },
  { id: 'ch7', file: 'tong-hop-chuong-7-cong-nghe-che-bien-sua.md', title: 'Các sản phẩm sữa' },
];

const report = { skipped: [], oddTables: [], softSplits: 0, shortened: 0, missingWords: [] };

const countWords = (text) => (text.match(/[\p{L}\p{N}]+/gu) || []).length;

/* marked coi "<200.000/mL**, …, viêm vú **" là một tag HTML vì dấu < gặp dấu > ở
   dòng khác, và nuốt luôn cả cụm — nên phải đối chiếu mọi từ của nguồn có mặt trong output. */
const TOKEN = /[\p{L}\p{N}]+/gu;

function verifyCoverage(sourceId, markdown, blocks) {
  const hrefs = JSON.stringify(blocks).match(/"href":"[^"]*"/g)?.join(' ') ?? '';
  const hay = `${blocks.map((b) => b.text).join(' ')} ${hrefs}`;
  const out = new Set((hay.match(TOKEN) || []).map((w) => w.toLowerCase()));
  const gone = [...new Set((markdown.match(TOKEN) || []).map((w) => w.toLowerCase()))].filter((w) => !out.has(w));
  if (gone.length) report.missingWords.push({ sourceId, count: gone.length, words: gone.slice(0, 12) });
}

function shortUrl(href) {
  try {
    const url = new URL(href);
    const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || '';
    report.shortened += 1;
    return `${url.hostname.replace(/^www\./, '')}/${id.slice(-6)}`;
  } catch {
    return href;
  }
}

/* ---------- inline ---------- */

const flag = (v) => v || 0;

function mergeRun(runs, run) {
  const last = runs[runs.length - 1];
  if (
    last &&
    !last.href &&
    !run.href &&
    !last.c &&
    !run.c &&
    flag(last.b) === flag(run.b) &&
    flag(last.i) === flag(run.i) &&
    flag(last.s) === flag(run.s)
  ) {
    last.x += run.x;
    return;
  }
  runs.push(run);
}

function inlineRuns(tokens) {
  const runs = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case 'text':
        mergeRun(runs, { x: t.text });
        break;
      case 'br':
        runs.push({ x: '\n' });
        break;
      case 'escape':
        mergeRun(runs, { x: t.text });
        break;
      case 'strong':
      case 'em': {
        const key = t.type === 'strong' ? 'b' : 'i';
        const inner = inlineRuns(t.tokens);
        if (!inner.length) {
          mergeRun(runs, { x: t.text || '', [key]: 1 });
          break;
        }
        for (const r of inner) mergeRun(runs, { ...r, [key]: 1 });
        break;
      }
      case 'del':
        for (const r of inlineRuns(t.tokens)) mergeRun(runs, { ...r, s: 1 });
        break;
      case 'codespan':
        runs.push({ x: t.text, c: 1 });
        break;
      case 'link': {
        const label = (t.text || '').trim();
        runs.push({
          x: /^https?:/.test(label) ? shortUrl(t.href) : label || shortUrl(t.href),
          href: t.href,
        });
        break;
      }
      case 'html':
        report.skipped.push(`html: ${t.raw.trim().slice(0, 40)}`);
        break;
      default:
        report.skipped.push(`${t.type}`);
        mergeRun(runs, { x: t.text ?? '' });
    }
  }
  return runs.filter((r) => r.x !== '');
}

/* Dòng mềm trong một paragraph (2 dòng phụ đề dưới H1 của mỗi file) sẽ bị trình duyệt
   dính thành một đoạn — tách thành từng khối riêng để chỉ số khối khớp bố cục thật. */
function pushParagraph(runs, blocks) {
  const lines = [[]];
  for (const r of runs) {
    if (r.x === '\n') {
      report.softSplits += 1;
      lines.push([]);
    } else lines[lines.length - 1].push(r);
  }
  for (const line of lines) if (line.length) blocks.push({ t: 'p', runs: line });
}

/* ---------- block ---------- */

function collectBlocks(tokens, blocks, depth = 0) {
  for (const t of tokens) {
    switch (t.type) {
      case 'heading':
        blocks.push({ t: 'h', lv: t.depth, runs: inlineRuns(t.tokens) });
        break;
      case 'paragraph':
        pushParagraph(inlineRuns(t.tokens), blocks);
        break;
      case 'text':
        pushParagraph(inlineRuns(t.tokens?.length ? t.tokens : [{ type: 'text', text: t.text }]), blocks);
        break;
      case 'blockquote': {
        const inner = collectBlocks(t.tokens, []);
        for (const b of inner) blocks.push(b.t === 'p' ? { t: 'quote', runs: b.runs } : b);
        break;
      }
      case 'list':
        for (const item of t.items) {
          const own = item.tokens.filter((x) => x.type !== 'list');
          const nested = item.tokens.filter((x) => x.type === 'list');
          const runs = own.flatMap((x) =>
            inlineRuns(x.tokens?.length ? x.tokens : x.text ? [{ type: 'text', text: x.text }] : []),
          );
          if (runs.length) blocks.push({ t: 'li', ol: !!t.ordered, start: t.start, depth, runs });
          for (const nl of nested) collectBlocks([nl], blocks, depth + 1);
        }
        break;
      case 'table': {
        const cols = t.header.map(tableCell);
        const rows = t.rows.map((row) => row.map(tableCell));
        const widths = new Set([cols.length, ...rows.map((r) => r.length)]);
        if (widths.size > 1) report.oddTables.push({ at: blocks.length, widths: [...widths] });
        blocks.push({ t: 'table', cols, rows, align: t.align });
        break;
      }
      case 'hr':
        blocks.push({ t: 'hr' });
        break;
      case 'space':
        break;
      default:
        report.skipped.push(`block:${t.type}`);
    }
  }
  return blocks;
}

const tableCell = (cell) =>
  inlineRuns(cell.tokens?.length ? cell.tokens : [{ type: 'text', text: cell.text ?? '' }]);

/* List gộp thành một khối ul/ol để giữ ngữ nghĩa <ul><li>. Item giữ depth để lồng nhau;
   vị trí đọc giữa một danh sách dài lấy bằng tỉ lệ trong khối, không cần chỉ số item. */

/* Depth trong một khối phải bắt đầu ở 0 và mỗi món không được sâu hơn món trước quá một cấp:
   màn đọc dựng cây <ul>/<ol> từ depth, còn món lồng mà chưa có cha trong cùng khối thì bị bỏ.
   Markdown nguồn hay rơi vào đây khi cả một danh sách con thụt lề ngay dưới heading
   hoặc dưới một bullet đã bị tách sang khối khác (dòng mềm). */
function normalizeDepths(items) {
  const base = Math.min(...items.map((i) => i.depth));
  let prev = -1;
  for (const it of items) {
    it.depth = Math.min(it.depth - base, prev + 1);
    prev = it.depth;
  }
}

function groupLists(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.t !== 'li') {
      out.push(b);
      continue;
    }
    const last = out[out.length - 1];
    if (last && last.t === 'list' && last.ol === b.ol) last.items.push({ depth: b.depth, runs: b.runs });
    else out.push({ t: 'list', ol: b.ol, start: b.start || 1, items: [{ depth: b.depth, runs: b.runs }] });
  }
  for (const b of out) if (b.t === 'list') normalizeDepths(b.items);
  return out;
}

/* Dựng text của khối theo đúng thứ tự render và đóng dấu offset ký tự lên từng run.
   Runtime cần run.o để ánh xạ selection DOM -> khoảng [start,end] trong block.text,
   nên hai bên phải dùng chung một cách nối chuỗi, tính cả phần ngăn cách. */
function stampText(b) {
  let cursor = 0;
  const parts = [];
  const walk = (runs) => {
    runs.forEach((r) => {
      r.o = cursor;
      const text = r.x === '\n' ? ' ' : r.x;
      cursor += text.length;
      parts.push(text);
    });
  };
  const gap = (s) => {
    cursor += s.length;
    parts.push(s);
  };

  if (b.t === 'hr') {
    b.text = '';
    b.w = 0;
    return;
  }
  if (b.runs) walk(b.runs);
  if (b.items) {
    b.items.forEach((it, i) => {
      if (i) gap(' ');
      walk(it.runs);
    });
  }
  if (b.t === 'table') {
    const line = (cells) =>
      cells.forEach((cell, i) => {
        if (i) gap(' | ');
        walk(cell);
      });
    line(b.cols);
    b.rows.forEach((row) => {
      gap(' ');
      line(row);
    });
  }
  b.text = parts.join('');
  b.w = countWords(b.text);
}

function addText(blocks) {
  blocks.forEach((b, i) => {
    b.n = i;
    stampText(b);
  });
  return blocks;
}

/* ---------- chương ---------- */

function buildChapter(source, index) {
  const md = readFileSync(resolve(srcDir, source.file), 'utf8');
  const tokens = marked.lexer(md, { gfm: true });

  // H1 của file trùng tiêu đề chương nên bỏ; phần còn lại giữ nguyên thứ tự tài liệu.
  const h1 = tokens.find((t) => t.type === 'heading' && t.depth === 1);
  if (!h1) report.skipped.push(`${source.id}: không có H1`);
  const body = tokens.filter((t) => t !== h1 && t.type !== 'space');

  const blocks = addText(groupLists(collectBlocks(body, [])));
  verifyCoverage(source.id, body.map((t) => t.raw).join('\n'), blocks);

  // Khối trước heading đầu tiên = lời dẫn chương, Reader dựng chữ nhỏ hơn.
  const firstHead = blocks.findIndex((b) => b.t === 'h');
  if (firstHead > 0) blocks.slice(0, firstHead).forEach((b) => (b.intro = 1));

  const tables = blocks.filter((b) => b.t === 'table').length;
  const maxCols = Math.max(0, ...blocks.filter((b) => b.t === 'table').map((b) => b.cols.length));
  const toc = blocks.filter((b) => b.t === 'h' && b.lv > 1).map((b) => ({ lv: b.lv - 1, block: b.n, text: b.text }));

  return {
    meta: {
      id: source.id,
      no: index + 1,
      title: `Chương ${index + 1} · ${source.title}`,
      short: `Chương ${index + 1}`,
      words: blocks.reduce((s, b) => s + b.w, 0),
      blockCount: blocks.length,
      parts: toc.filter((e) => e.lv === 1 && /^phần\b/i.test(e.text)).length,
      tables,
      maxCols,
      toc,
    },
    chapter: { id: source.id, blocks },
  };
}

mkdirSync(outDir, { recursive: true });

const chapters = [];
for (const [i, source] of SOURCES.entries()) {
  const { meta, chapter } = buildChapter(source, i);
  chapters.push(meta);
  writeFileSync(resolve(outDir, `${source.id}.json`), JSON.stringify(chapter, null, 0), 'utf8');
}

writeFileSync(
  resolve(outDir, 'index.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), book: { ...BOOK, chapters } }, null, 0),
  'utf8',
);

const totals = chapters.reduce((s, c) => s + c.words, 0);
console.log(`${BOOK.id} — ${chapters.length} chương, ${totals} từ`);
for (const c of chapters) {
  const size = readFileSync(resolve(outDir, `${c.id}.json`), 'utf8').length;
  console.log(
    `  ${c.id}  ${String(c.words).padStart(4)} từ  ${String(c.blockCount).padStart(3)} khối  ` +
      `${c.parts} phần  ${c.toc.length} mục lục  ${c.tables} bảng (max ${c.maxCols} cột)  ${(size / 1024).toFixed(0)} KB`,
  );
}
if (report.oddTables.length) console.log('  BẢNG LỆNH SỐ CỘT:', report.oddTables);
if (report.missingWords.length) console.log('  TỪ NGUỒN KHÔNG CÓ TRONG OUTPUT:', report.missingWords);
if (report.skipped.length) console.log('  BỎ QUA:', [...new Set(report.skipped)].join(', '));
console.log(`  URL rút gọn nhãn: ${report.shortened} · paragraph tách dòng mềm: ${report.softSplits}`);
