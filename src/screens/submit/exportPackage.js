import {
  TH_SUA_BAI,
  formatBytes,
  getSubmissionFileUrl,
  laLink,
  submissionId,
} from '../../lib/submissions';
import { formatTimestamp } from './shared';

const INFO_FILE = 'THONG-TIN.txt';
const LINK_FILE = 'LIEN-KET.txt';
const ERROR_FILE = 'LOI-TAI-FILE.txt';
const NEWLINE = '\r\n';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayStamp(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function safeSegment(value, fallback) {
  const cleaned = String(value || '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim();
  return cleaned.slice(0, 120) || fallback;
}

function buildItems() {
  const items = [];
  for (const b of TH_SUA_BAI) {
    const baiFolder = `Bài ${b.bai} - ${safeSegment(b.tieuDe, `Bai ${b.bai}`)}`;
    if (b.phans) {
      for (const p of b.phans) {
        items.push({
          id: submissionId(b.bai, p.phan),
          groupTitle: `Bài ${b.bai} — ${b.tieuDe}`,
          label: `Phần ${p.phan}: ${p.ten}`,
          short: `Phần ${p.phan}`,
          folder: `${baiFolder}/${safeSegment(`${p.phan} - ${p.ten}`, `Phan ${p.phan}`)}`,
        });
      }
    } else {
      items.push({
        id: submissionId(b.bai),
        groupTitle: `Bài ${b.bai} — ${b.tieuDe}`,
        label: `Bài ${b.bai}: ${b.tieuDe}`,
        short: `Bài ${b.bai}`,
        folder: baiFolder,
      });
    }
  }
  return items;
}

function memberLabel(n) {
  const ten = String(n?.ten || '').trim() || 'Ẩn danh';
  const mssv = String(n?.mssv || '').trim();
  return mssv ? `${ten} (${mssv})` : ten;
}

function collectMembers(items, subs) {
  const map = new Map();
  for (const it of items) {
    const sub = subs[it.id];
    if (sub?.status !== 'active') continue;
    for (const n of sub.nguoi || []) {
      const key = String(n?.mssv || n?.ten || '').trim().toLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, { ten: n?.ten || '', mssv: n?.mssv || '', items: [] });
      map.get(key).items.push(it.short);
    }
  }
  return [...map.values()];
}

function buildLinkText(it, sub) {
  return [
    'LIÊN KẾT BÀI LÀM',
    '============================================================',
    `Bài          : ${it.groupTitle}`,
    `Mục          : ${it.label}`,
    `Thành viên   : ${(sub.nguoi || []).map(memberLabel).join(' + ') || '—'}`,
    `Liên kết     : ${sub.link}`,
    `Nộp lúc      : ${formatTimestamp(sub.submittedAt)}`,
    `Số lần nộp   : ${sub.lanNop || 1}`,
    '',
    'Ghi chú: mục này nộp dạng liên kết nên không có tệp trong gói ZIP.',
    '',
  ].join(NEWLINE);
}

function buildInfoText({ items, subs, me, failures }) {
  const activeItems = items.filter((it) => subs[it.id]?.status === 'active');
  const done = activeItems.length;
  const total = items.length;
  const members = collectMembers(items, subs);
  const lines = [];

  lines.push('\uFEFFTHỰC HÀNH CÔNG NGHỆ CHẾ BIẾN SỮA — TỔNG QUAN BÀI NỘP');
  lines.push('============================================================');
  lines.push(`Thời điểm xuất : ${formatTimestamp(new Date())}`);
  lines.push(`Người xuất     : ${me?.ten ? memberLabel(me) : '—'}`);
  lines.push(`Tổng số mục    : ${total}`);
  lines.push(`Đã nộp         : ${done}/${total}`);
  lines.push(`Còn thiếu      : ${total - done}`);
  if (failures.length > 0) {
    lines.push(`Tệp lỗi tải    : ${failures.length} (xem ${ERROR_FILE})`);
  }
  lines.push('');

  lines.push('DANH SÁCH THÀNH VIÊN');
  lines.push('------------------------------------------------------------');
  if (members.length === 0) {
    lines.push('Chưa có thành viên nào được ghi nhận trong các bài đã nộp.');
  } else {
    members.forEach((m, i) => {
      lines.push(`${i + 1}. ${m.ten || 'Ẩn danh'}${m.mssv ? ` (${m.mssv})` : ''}`);
      lines.push(`   Tham gia: ${m.items.join(', ')}`);
    });
  }
  lines.push('');

  lines.push('CHI TIẾT BÀI NỘP');
  lines.push('------------------------------------------------------------');
  let lastGroup = '';
  for (const it of items) {
    const sub = subs[it.id];
    const isActive = sub?.status === 'active';
    if (it.groupTitle !== lastGroup) {
      if (lastGroup) lines.push('');
      lines.push(it.groupTitle.toUpperCase());
      lastGroup = it.groupTitle;
    }
    lines.push(`  ${it.label}`);
    lines.push(`    Trạng thái : ${isActive ? 'Đã nộp' : 'Chưa nộp'}`);
    if (isActive) {
      lines.push(`    Thành viên : ${(sub.nguoi || []).map(memberLabel).join(' + ') || '—'}`);
      lines.push(`    Hình thức  : ${laLink(sub) ? 'Liên kết' : 'Tệp tin'}`);
      lines.push(`    Sản phẩm   : ${sub.fileName || '—'}`);
      if (!laLink(sub) && Number.isFinite(sub.size)) {
        lines.push(`    Kích thước : ${formatBytes(sub.size)}`);
      }
      if (laLink(sub)) lines.push(`    Liên kết   : ${sub.link}`);
      lines.push(`    Nộp lúc    : ${formatTimestamp(sub.submittedAt)}`);
      lines.push(`    Số lần nộp : ${sub.lanNop || 1}`);
      const failure = failures.find((f) => f.id === it.id);
      if (failure) lines.push(`    Ghi chú    : Không tải được tệp (${failure.reason})`);
    }
    lines.push('');
  }

  lines.push('GHI CHÚ');
  lines.push('------------------------------------------------------------');
  lines.push('• Mục nộp dạng liên kết chỉ lưu URL, xem tệp LIEN-KET.txt trong thư mục tương ứng.');
  lines.push('• Các bản nộp cũ đã bị ghi đè/xoá (backup) không nằm trong gói ZIP này.');
  lines.push('');
  return lines.join(NEWLINE);
}

function buildErrorText(failures) {
  const lines = [
    'CÁC TỆP KHÔNG TẢI ĐƯỢC',
    '============================================================',
    '',
  ];
  failures.forEach((f, i) => {
    lines.push(`${i + 1}. ${f.groupTitle} — ${f.label}`);
    lines.push(`   Tệp    : ${f.fileName || '—'}`);
    lines.push(`   Lý do  : ${f.reason}`);
  });
  lines.push('');
  return lines.join(NEWLINE);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function exportSubmissionPackage({ subs = {}, me, onProgress } = {}) {
  const safeSubs = subs || {};
  const items = buildItems();
  const activeItems = items.filter((it) => safeSubs[it.id]?.status === 'active');
  if (activeItems.length === 0) {
    throw new Error('Chưa có bài nào được nộp để xuất ZIP.');
  }

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const failures = [];
  const total = activeItems.length;
  let done = 0;

  for (const it of activeItems) {
    const sub = safeSubs[it.id];
    onProgress?.({ phase: 'files', done, total, label: it.short });
    const folder = zip.folder(it.folder);

    if (laLink(sub)) {
      folder.file(LINK_FILE, buildLinkText(it, sub));
    } else {
      try {
        const res = await fetch(getSubmissionFileUrl(sub.storagePath));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        folder.file(safeSegment(sub.fileName, `${it.id}.bin`), blob, {
          binary: true,
          compression: 'STORE',
        });
      } catch (err) {
        failures.push({
          id: it.id,
          groupTitle: it.groupTitle,
          label: it.label,
          fileName: sub.fileName,
          reason: err?.message || 'Lỗi không xác định',
        });
      }
    }

    done += 1;
    onProgress?.({ phase: 'files', done, total, label: it.short });
  }

  zip.file(INFO_FILE, buildInfoText({ items, subs: safeSubs, me, failures }));
  if (failures.length > 0) zip.file(ERROR_FILE, buildErrorText(failures));

  onProgress?.({ phase: 'zip', percent: 0 });
  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.({ phase: 'zip', percent: Math.round(meta.percent) }),
  );

  const fileName = `TH-Sua_Bai-nop_${todayStamp()}.zip`;
  downloadBlob(blob, fileName);
  return { fileName, total, failures };
}
