#!/usr/bin/env node
/* Soi toàn bộ src/data/book/*.json xem có đúng hợp đồng block model mà runtime trông đợi không.
   Chạy: node .qoder/skills/build-book/scripts/check-book.mjs   (thoát 1 khi có FAIL) */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const dataDir = join(root, 'src', 'data', 'book');
const sourceDir = join(root, 'data', 'sources', 'book');

const TYPES = new Set(['h', 'p', 'quote', 'list', 'table', 'hr']);
const problems = [];
const note = (level, msg) => problems.push({ level, msg });
const fail = (m) => note('FAIL', m);
const warn = (m) => note('WARN', m);

const countWords = (text) => (text.match(/[\p{L}\p{N}]+/gu) || []).length;
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

/* ---------- index.json ---------- */

const indexPath = join(dataDir, 'index.json');
if (!existsSync(indexPath)) {
  console.log('FAIL  không có src/data/book/index.json — chạy `npm run book` trước.');
  process.exit(1);
}
const index = read(indexPath);
const chapters = index.book?.chapters ?? [];

for (const key of ['id', 'title', 'author']) if (!index.book?.[key]) fail(`index.json thiếu book.${key}`);
if (!chapters.length) fail('index.json không có chương nào');

const ids = chapters.map((c) => c.id);
if (new Set(ids).size !== ids.length) fail(`id chương trùng nhau: ${ids.join(', ')}`);
if (ids.some((id) => !/^ch\d+$/.test(id))) fail(`id chương phải khớp /^ch\\d+$/ (${ids.join(', ')})`);
const nums = chapters.map((c) => Number(String(c.id).slice(2)));
if (nums.some((n, i) => n !== i + 1)) fail(`thứ tự id không tăng theo vị trí: ${ids.join(', ')}`);

/* ---------- SOURCES trong build script vs file trên đĩa ---------- */

const buildScript = readFileSync(join(root, 'scripts', 'build-book.mjs'), 'utf8');
const block = /const SOURCES = \[([\s\S]*?)\n\];/.exec(buildScript)?.[1] ?? '';
const sources = [...block.matchAll(/\{([^}]*)\}/g)].map((m) => {
  const field = (name) => new RegExp(`${name}:\\s*'([^']*)'`).exec(m[1])?.[1];
  return { id: field('id'), file: field('file'), title: field('title') };
});
if (!sources.length) fail('không đọc được mảng SOURCES trong scripts/build-book.mjs');

for (const s of sources) {
  if (!s.id || !s.file || !s.title) {
    fail(`SOURCES thiếu trường: ${JSON.stringify(s)}`);
    continue;
  }
  if (!existsSync(join(sourceDir, s.file))) fail(`SOURCES chỏ vào file không có: data/sources/book/${s.file}`);
  if (!ids.includes(s.id)) fail(`SOURCES có ${s.id} nhưng index.json không có — chưa chạy npm run book?`);
}
const listed = new Set(sources.map((s) => s.file));
for (const md of readdirSync(sourceDir).filter((f) => f.endsWith('.md'))) {
  if (!listed.has(md)) warn(`md nằm trong data/sources/book/ nhưng không có trong SOURCES: ${md}`);
}

/* ---------- từng chương ---------- */

let totalWords = 0;
const rows = [];

for (const [i, meta] of chapters.entries()) {
  const path = join(dataDir, `${meta.id}.json`);
  if (!existsSync(path)) {
    fail(`thiếu ${meta.id}.json — chưa chạy npm run book?`);
    continue;
  }
  const { blocks } = read(path);
  const errs = [];
  const bad = (m) => errs.push(m);

  if (!Array.isArray(blocks) || !blocks.length) bad('blocks rỗng');
  if (meta.blockCount !== blocks.length) bad(`meta.blockCount ${meta.blockCount} ≠ ${blocks.length} khối`);
  if (meta.no !== i + 1) bad(`meta.no ${meta.no} ≠ vị trí ${i + 1}`);
  if (meta.short !== `Chương ${i + 1}`) bad(`meta.short "${meta.short}" ≠ "Chương ${i + 1}"`);
  if (!new RegExp(`^Chương ${i + 1} · `).test(meta.title || '')) bad(`meta.title không bắt đầu bằng "Chương ${i + 1} · "`);

  let words = 0;
  let tables = 0;
  let maxCols = 0;

  blocks.forEach((b, n) => {
    if (b.n !== n) bad(`khối ${n}: n = ${b.n}`);
    if (!TYPES.has(b.t)) bad(`khối ${n}: loại lạ "${b.t}"`);
    if (typeof b.text !== 'string') bad(`khối ${n}: thiếu text`);
    if (b.t === 'hr') return;
    if (b.w !== countWords(b.text ?? '')) bad(`khối ${n}: w ${b.w} ≠ đếm lại ${countWords(b.text ?? '')}`);

    let cursor = 0;
    const gap = (n2) => {
      cursor += n2;
    };
    const walk = (runs, where) => {
      for (const r of runs || []) {
        const piece = (r.x === '\n' ? ' ' : r.x ?? '').toString();
        if (r.o !== cursor) bad(`khối ${n} ${where}: offset ${r.o} ≠ ${cursor}`);
        if ((b.text ?? '').slice(r.o, r.o + piece.length) !== piece) {
          bad(`khối ${n} ${where}: text.slice(${r.o}) không ra "${piece.slice(0, 24)}"`);
        }
        cursor += piece.length;
      }
    };
    const walkCells = (cells, where, before) =>
      cells?.forEach((cell, k) => {
        before?.(k);
        walk(cell, `${where}[${k}]`);
      });

    if (b.t === 'table') {
      tables += 1;
      maxCols = Math.max(maxCols, b.cols?.length ?? 0);
      /* must mirror stampText() in scripts/build-book.mjs: ' | ' between cells, ' ' before each row */
      walkCells(b.cols, 'cols', (k) => k && gap(3));
      (b.rows ?? []).forEach((row, r) => {
        if (row.length !== b.cols.length) bad(`khối ${n}: dòng ${r} có ${row.length} cột, bảng có ${b.cols.length}`);
        gap(1);
        walkCells(row, `rows[${r}]`, (k) => k && gap(3));
      });
    } else if (b.t === 'list') {
      /* must mirror buildNodes() in src/components/blocks.jsx: món có depth nhảy quá một cấp
         so với món trước (hoặc khối bắt đầu bằng món lồng) thì màn đọc bỏ luôn món đó. */
      let level = -1;
      b.items?.forEach((it, k) => {
        if (k) gap(1);
        const d = it.depth ?? 0;
        if (d > level + 1) bad(`khối ${n}: món ${k} depth ${d} sau depth ${level} — màn đọc sẽ bỏ món này`);
        level = d;
        walk(it.runs, `items[${k}]`);
      });
    } else {
      walk(b.runs, 'runs');
    }

    if ((b.text ?? '').length !== cursor) bad(`khối ${n}: text dài ${(b.text ?? '').length}, dựng lại dài ${cursor}`);
    if (b.t === 'h' && !(b.lv >= 1 && b.lv <= 4)) bad(`khối ${n}: heading lv ${b.lv}`);
    words += b.w ?? 0;
  });

  if (meta.words !== words) bad(`meta.words ${meta.words} ≠ đếm lại ${words}`);
  if (meta.tables !== tables) bad(`meta.tables ${meta.tables} ≠ ${tables}`);
  if (meta.maxCols !== maxCols) bad(`meta.maxCols ${meta.maxCols} ≠ ${maxCols}`);

  for (const e of meta.toc ?? []) {
    const b = blocks[e.block];
    if (!b || b.t !== 'h') bad(`mục lục trỏ khối ${e.block} không phải heading`);
    else if (b.lv !== e.lv + 1) bad(`mục lục khối ${e.block}: lv ${e.lv} ≠ heading ${b.lv} - 1`);
    else if (b.text !== e.text) bad(`mục lục khối ${e.block} lệch chữ`);
  }
  const phan = (meta.toc ?? []).filter((e) => e.lv === 1 && /^phần\b/i.test(e.text)).length;
  if (meta.parts !== phan) bad(`meta.parts ${meta.parts} ≠ ${phan} mục "Phần" lv1`);

  totalWords += words;
  rows.push({ id: meta.id, words, blocks: blocks.length, tables, maxCols, errs });
  if (errs.length) fail(`${meta.id}: ${errs.length} lỗi cấu trúc khối`);
}

/* ---------- so với bản đã commit: chỉ số khối dịch thì chỗ đọc/tô sáng lệch ---------- */

let committed = null;
try {
  committed = JSON.parse(
    execFileSync('git', ['show', 'HEAD:src/data/book/index.json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  ).book.chapters;
} catch {
  /* chưa commit thì không có gì để so */
}

/* ---------- in ---------- */

for (const r of rows) {
  const line = `  ${r.id}  ${String(r.words).padStart(5)} từ  ${String(r.blocks).padStart(3)} khối  ${r.tables} bảng (max ${r.maxCols} cột)`;
  if (r.errs.length) console.log(`FAIL${line}\n        ${r.errs.slice(0, 6).join('\n        ')}${r.errs.length > 6 ? `\n        … còn ${r.errs.length - 6} lỗi` : ''}`);
  else console.log(`OK  ${line}`);
}

if (committed) {
  for (const r of rows) {
    const c = committed.find((x) => x.id === r.id);
    if (!c) {
      console.log(`NEW ${r.id}: chương mới hoàn toàn (${r.blocks} khối) — người dùng chưa có vị trí cũ cho chương này.`);
      continue;
    }
    if (c.blockCount !== r.blocks || c.words !== r.words) {
      warn(`${r.id}: ${c.blockCount} → ${r.blocks} khối, ${c.words} → ${r.words} từ so với bản commit — chỗ đọc và tô sáng đã lưu của người dùng cũ có thể lệch.`);
    }
  }
} else {
  console.log('INFO  src/data/book chưa có trong git HEAD nên không so được chênh lệch blockCount.');
}

const fails = problems.filter((p) => p.level === 'FAIL');
const warns = problems.filter((p) => p.level === 'WARN');
for (const p of problems) console.log(`${p.level}  ${p.msg}`);

const sum = chapters.reduce((s, c) => s + (c.words ?? 0), 0);
console.log(
  `\n${rows.length} chương · ${sum} từ (đếm lại ${totalWords}) · ${fails.length} FAIL · ${warns.length} WARN`,
);
if (sum !== totalWords) console.log('FAIL  tổng từ trong index.json ≠ cộng từ các khối');
process.exit(fails.length || sum !== totalWords ? 1 : 0);
