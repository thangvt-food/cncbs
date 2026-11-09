import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcesDir = resolve(root, 'data/sources');

const SOURCES = [
  {
    id: 'sua-vsv',
    path: resolve(sourcesDir, 'gemini-code-1793867808816.json'),
    title: 'Thi giữa kỳ môn Sữa lần 1',
  },
  {
    id: 'tong-hop-dot-3',
    path: resolve(sourcesDir, 'gemini-code-1793869261405.json'),
    title: 'Thi giữa kỳ môn Sữa lần 2',
  },
  {
    id: 'nguyen-ly-ktpb',
    path: resolve(sourcesDir, 'gemini-code-1793874992421.json'),
    title: 'Kỹ thuật Thực phẩm 2 (giữa kỳ)',
  },
];

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// Sources are AI chat exports: the tail of a truncated file is an incomplete object.
// Scan the cau_hoi array and keep only balanced top-level objects.
function extractObjects(text) {
  const marker = text.indexOf('"cau_hoi"');
  if (marker === -1) return null;
  const start = text.indexOf('[', marker);
  const out = [];
  let depth = 0;
  let begin = -1;
  let inString = false;
  let escaped = false;
  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) begin = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        out.push(text.slice(begin, i + 1));
      } else if (depth < 0) break;
    } else if (ch === ']' && depth === 0) break;
  }
  return out.map((raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// matching_item không có lựa chọn kèm theo: gom mọi đáp án của cả nhóm làm một pool chung,
// mỗi câu thành một câu một-đáp-án chọn từ pool đó.
function matchingPool(raws) {
  const seen = new Map();
  for (const raw of raws) {
    if (raw.loai !== 'matching_item') continue;
    const list = Array.isArray(raw.dap_an) ? raw.dap_an : [raw.dap_an];
    for (const a of list) {
      const text = String(a ?? '').trim();
      if (text && !seen.has(norm(text))) seen.set(norm(text), text);
    }
  }
  return [...seen.values()].map((text, i) => ({ key: String.fromCharCode(65 + i), text }));
}

function fromGemini(raw, pool = []) {
  const typeMap = {
    single_choice: 'single',
    true_false: 'true_false',
    multiple_select: 'multi',
    matching_item: 'single',
  };
  const type = typeMap[raw.loai] ?? 'single';
  const listed =
    raw.loai === 'matching_item'
      ? pool
      : (raw.cac_lua_chon ?? []).map((opt, i) => {
          const m = /^([A-Z])\s*[:.]\s*(.*)$/s.exec(String(opt).trim());
          return m && i < 26
            ? { key: m[1], text: m[2].trim() }
            : { key: String.fromCharCode(65 + i), text: String(opt).trim() };
        });
  const answerList = Array.isArray(raw.dap_an) ? raw.dap_an : [raw.dap_an];
  const answers = [];
  for (const a of answerList) {
    const letter = /^([A-Z])\s*[:.]/.exec(String(a).trim())?.[1];
    const hit =
      listed.find((o) => o.key === letter) ??
      listed.find((o) => norm(o.text) === norm(a)) ??
      listed.find((o) => norm(o.text).startsWith(norm(a))) ??
      listed.find((o) => norm(a).includes(norm(o.text)) && norm(o.text).length > 2);
    if (hit) answers.push(hit.key);
  }
  return {
    id: raw.id,
    type,
    text: raw.cau_hoi,
    options: listed,
    answers: [...new Set(answers)],
  };
}

function fromThiLan1(raw) {
  const type =
    raw.type === 'true_false' ? 'true_false' : raw.type === 'multiple_blank_matrix' ? 'blanks' : 'single';
  const options = Object.entries(raw.options ?? {}).map(([key, text]) => ({ key, text: String(text) }));
  const answers = Array.isArray(raw.answer) ? raw.answer : raw.answer ? [raw.answer] : [];
  const q = { id: raw.id, type, text: raw.question ?? '', options, answers };
  if (type === 'blanks') {
    q.passage = raw.passage;
    q.pool = raw.options_per_blank ?? [];
    q.blanks = (raw.sub_questions ?? []).map((s) => ({ id: s.blank_id, answer: s.answer }));
  }
  return q;
}

const banks = SOURCES.map((src, i) => {
  const text = readFileSync(src.path, 'utf8');
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  const title = src.title ?? parsed?.ten_de;
  const isArraySource = Array.isArray(parsed);
  const raws = isArraySource ? parsed : extractObjects(text) ?? parsed?.cau_hoi ?? [];
  const pool = isArraySource ? [] : matchingPool(raws);
  const questions = raws.map((raw) => (isArraySource ? fromThiLan1(raw) : fromGemini(raw, pool)));
  questions.forEach((q) => {
    q.id = `${src.id}-${q.id}`;
    q.bank = src.id;
    q.group = i + 1;
  });
  return {
    id: src.id,
    title,
    short: title.replace(/^Bộ \d+ câu hỏi\s*/i, '').trim() || title,
    source: src.path,
    truncated: !parsed,
    group: i + 1,
    total: questions.length,
    declared: parsed?.tong_so_cau ?? parsed?.tong_so_cau_va_diem ?? questions.length,
    questions,
  };
});

const bad = banks.flatMap((b) =>
  b.questions.filter((q) => q.type !== 'blanks' && (!q.answers.length || q.answers.length > q.options.length)).map((q) => `${b.id}/${q.id}`),
);
console.log('Ngân hàng đã nạp:');
for (const b of banks) {
  const t = b.questions.reduce((a, q) => ((a[q.type] = (a[q.type] ?? 0) + 1), a), {});
  console.log(
    `  ${b.id.padEnd(15)} ${String(b.total).padStart(3)} câu${b.truncated ? ' (tệp bị cắt, vớt phần hợp lệ)' : ''} — ${Object.entries(t).map(([k, v]) => `${k}:${v}`).join(' ')}`,
  );
}
console.log('Khai báo trong tệp:', banks.map((b) => b.declared).join(', '));
console.log(bad.length ? `Thiếu đáp án (${bad.length}): ${bad.join(', ')}` : 'Mọi câu đều khớp đáp án.');

mkdirSync(resolve(root, 'src/data'), { recursive: true });
writeFileSync(
  resolve(root, 'src/data/banks.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), banks }, null, 0),
  'utf8',
);
console.log('Đã ghi src/data/banks.json');
