#!/usr/bin/env node
/* Thêm một chương vào tài liệu đọc: kiểm markdown, chép vào data/sources/book/,
   cắm mục tử vào SOURCES trong scripts/build-book.mjs, chạy npm run book rồi check-book.

   node .qoder/skills/build-book/scripts/add-chapter.mjs <file.md> --title "..." [--id ch5] [--at <i>] [--dry] [--force] */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const sourceDir = join(root, 'data', 'sources', 'book');
const scriptPath = join(root, 'scripts', 'build-book.mjs');

const argv = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a.startsWith('--')) {
    if (['--title', '--id', '--at'].includes(a)) flags[a.slice(2)] = argv[++i];
    else flags[a.slice(2)] = true;
  } else pos.push(a);
}

const die = (m) => {
  console.log(`DỪNG  ${m}`);
  process.exit(1);
};

const file = pos[0];
if (!file) die('dùng: add-chapter.mjs <file.md> --title "Tên chương" [--id ch5] [--at i] [--dry] [--force]');
const src = resolve(process.cwd(), file);
if (!existsSync(src)) die(`không thấy file ${file}`);

const md = readFileSync(src, 'utf8');
const title = flags.title?.trim();
if (!title) die('cần --title "..." (tên chương hiển thị, không lấy từ file)');
if (!/^# [^\s]/m.test(md)) die('file md phải có một dòng H1 `# ...` (bị bỏ khi build vì trùng tiêu đề chương)');
if (!/^## /m.test(md)) die('file md chưa có heading `## ` nào — mục lục sẽ trống');

const existing = readFileSync(scriptPath, 'utf8');
const body = /const SOURCES = \[([\s\S]*?)\n\];/.exec(existing);
if (!body) die('không tìm thấy mảng SOURCES trong scripts/build-book.mjs');
const entries = [...body[1].matchAll(/\{[^}]*\}/g)].map((m) => {
  const field = (name) => new RegExp(`${name}:\\s*'([^']*)'`).exec(m[0])?.[1];
  return { id: field('id'), file: field('file'), title: field('title'), raw: m[0] };
});

const wanted = flags.id ?? `ch${entries.length + 1}`;
if (!/^ch\d+$/.test(wanted)) die(`--id phải khớp /^ch\\d+$/ (nhận được "${wanted}")`);
if (entries.some((e) => e.id === wanted)) die(`id ${wanted} đã có trong SOURCES`);

const name = basename(src);
const dest = join(sourceDir, name);
if (entries.some((e) => e.file === name)) die(`SOURCES đã có file ${name}`);
if (existsSync(dest) && dest !== src && !flags.force) die(`data/sources/book/${name} đã tồn tại — thêm --force để ghi đè`);

const at = flags.at === undefined ? entries.length : Number(flags.at);
if (!Number.isInteger(at) || at < 0 || at > entries.length) die(`--at phải là số 0..${entries.length}`);

console.log(`  id     ${wanted}`);
console.log(`  file   data/sources/book/${name}`);
console.log(`  title  ${title}`);
console.log(`  vị trí #${at + 1} trong ${entries.length} chương hiện có`);
console.log(`  dòng chèn vào SOURCES:\n    { id: '${wanted}', file: '${name}', title: '${title}' },`);
if (flags.dry) {
  console.log('\n--dry nên chưa sửa gì.');
  process.exit(0);
}

if (dest !== src) copyFileSync(src, dest);

/* Dựng lại mảng SOURCES theo đúng kiểu đang có: một mục tử một dòng, thụt lề 2 space,
   dấu phẩy cuối dòng (kể cả mục tử cuối) nên chèn ở giữa không đổi format các dòng khác. */
const entryLine = `{ id: '${wanted}', file: '${name}', title: '${title.replace(/'/g, "\\'")}' }`;
const all = entries.map((e) => e.raw);
all.splice(at, 0, entryLine);
const next = existing.replace(
  body[0],
  `const SOURCES = [\n${all.map((l) => `  ${l},`).join('\n')}\n];`,
);
writeFileSync(scriptPath, next, 'utf8');
console.log('  đã sửa scripts/build-book.mjs');

const run = (cmd, args) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  try {
    console.log(execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim());
  } catch (e) {
    /* check-book thoát 1 khi có FAIL: in hết output rồi dừng lại ở đó, đừng để traceback ra lệnh. */
    console.log(String(e.stdout ?? '').trim());
    die(`${cmd} ${args.join(' ')} báo lỗi — sửa nguồn rồi chạy lại npm run book`);
  }
};

run('npm', ['run', '--silent', 'book']);
run('node', [join(root, '.qoder/skills/build-book/scripts/check-book.mjs')]);
console.log('\nTiếp theo: npm run dev rồi mở #doc/' + wanted + ', đọc một lượt xem marked có ăn mất chữ nào không.');
