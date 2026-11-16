/* Data layer cho form nộp bài TH Công nghệ chế biến sữa.
   Firestore: th-sua-submissions/{id}, th-sua-logs/{pushId}, th-sua-meta/usage.
   Bản nộp là tệp (Cloudflare R2 qua Worker th-sua-files) hoặc liên kết (Google Docs, Canva…):
     Tệp: th-sua/{id}/{file} (bản active), th-sua/backup/{ts}__{id}__{file} (bản bị xoá/ghi đè).
     Link: lưu thẳng URL trong doc, không chiếm dung lượng, không có backup.
  usage = tổng số byte đang thực sự nằm trong storage (active + backup), trần 100MB. */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { fileUrl, moveFile, uploadFile } from './filesApi';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const QUOTA_BYTES = 100 * 1024 * 1024;

const PHANS_BAI_1 = [
  'Đo tỷ trọng sữa',
  'Xác định pH và độ acid',
  'Thử độ tươi bằng cồn (Alcohol test)',
  'Thử khả năng đông tụ khi đun sôi',
  'Thử khả năng đông tụ với muối',
  'Thử nghiệm khử màu Xanh Methylen',
  'Quá trình sấy phun sữa',
  'Quá trình ly tâm tách kem và tách bơ',
];

export const TH_SUA_BAI = [
  {
    bai: 1,
    tieuDe: 'Kiểm nghiệm chất lượng sữa tươi và quá trình chế biến cơ bản',
    moTa: 'Phòng 104 Cẩm Tú — 8 phần độc lập, mỗi sinh viên làm và nộp 1 phần.',
    phans: PHANS_BAI_1.map((ten, i) => ({ phan: `1.${i + 1}`, ten })),
  },
  {
    bai: 2,
    tieuDe: 'Sản xuất sữa chua lên men dạng đặc',
    moTa: 'Xưởng phát triển sản phẩm — 1 người nộp đại diện, điền đầy đủ thông tin 2 người làm.',
  },
  {
    bai: 3,
    tieuDe: 'Sản xuất kem tươi',
    moTa: 'Xưởng phát triển sản phẩm — 1 người nộp đại diện, điền đầy đủ thông tin 2 người làm.',
  },
  {
    bai: 4,
    tieuDe: 'Sản xuất kem caramel (bánh flan)',
    moTa: 'Xưởng phát triển sản phẩm — 1 người nộp đại diện, điền đầy đủ thông tin 2 người làm.',
  },
  {
    bai: 5,
    tieuDe: 'Tổng hợp các sản phẩm sữa trên thị trường hiện nay',
    moTa: 'Xưởng phát triển sản phẩm — 1 người nộp đại diện, điền đầy đủ thông tin 2 người làm.',
  },
];

export function submissionId(bai, phan) {
  return phan ? `bai${phan}` : `bai${bai}`;
}

export function nhannot(id) {
  const bai = TH_SUA_BAI.find((b) => id === `bai${b.bai}` || b.phans?.some((p) => id === `bai${p.phan}`));
  if (!bai) return id;
  const phan = bai.phans?.find((p) => id === `bai${p.phan}`);
  return phan ? `Bài ${bai.bai} — ${phan.phan}. ${phan.ten}` : `Bài ${bai.bai} — ${bai.tieuDe}`;
}

export function formatBytes(n) {
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function getSubmissionFileUrl(storagePath) {
  if (!storagePath) return '';
  return fileUrl(storagePath);
}

export function laLink(sub) {
  return Boolean(sub?.link) && !sub?.storagePath;
}

export function normalizeLink(url) {
  const raw = String(url || '').trim();
  if (!raw) throw new Error('Dán liên kết bài làm (Google Docs, Canva…) vào ô Link.');
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('Liên kết không hợp lệ. Kiểm tra lại đường dẫn đã chép đủ chưa.');
  }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) {
    throw new Error('Liên kết phải bắt đầu bằng http:// hoặc https://.');
  }
  if (candidate.length > 600) throw new Error('Liên kết quá dài (tối đa 600 ký tự).');
  return candidate;
}

export function nguonCuaLink(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.endsWith('docs.google.com')) return 'Google Docs';
    if (host.endsWith('drive.google.com')) return 'Google Drive';
    if (host.endsWith('canva.com')) return 'Canva';
    if (host.endsWith('figma.com')) return 'Figma';
    if (host === 'notion.so' || host.endsWith('notion.site')) return 'Notion';
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube';
    return host;
  } catch {
    return 'Liên kết';
  }
}

export function tenFileAnToch(name) {
  const raw = String(name || 'bai-lam.docx').trim();
  const lastDot = raw.lastIndexOf('.');
  const ext = lastDot > 0 ? raw.slice(lastDot).toLowerCase().replace(/[^\w.]/g, '') : '';
  const baseName = lastDot > 0 ? raw.slice(0, lastDot) : raw;
  const cleanBase = baseName
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  const finalBase = (cleanBase || 'bai-lam').slice(0, 100);
  return ext ? `${finalBase}${ext}` : finalBase;
}

function docSub(id) {
  return doc(db, 'th-sua-submissions', id);
}

export async function listSubmissions() {
  const snap = await getDocs(collection(db, 'th-sua-submissions'));
  const out = {};
  snap.forEach((d) => {
    out[d.id] = d.data();
  });
  return out;
}

export async function getUsage() {
  const snap = await getDoc(doc(db, 'th-sua-meta/usage'));
  return snap.exists() ? snap.data().totalBytes || 0 : 0;
}

export async function getLogs(limit = 100) {
  const snap = await getDocs(collection(db, 'th-sua-logs'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.at?.seconds ?? 0) - (a.at?.seconds ?? 0))
    .slice(0, limit);
}

async function ghiLog(action, target, by, detail) {
  await addDoc(collection(db, 'th-sua-logs'), {
    action,
    target,
    targetLabel: nhannot(target),
    by: by ?? null,
    detail: detail ?? null,
    at: serverTimestamp(),
  });
}

/* Chuyển object trong R2 sang thùng backup kèm timestamp (move phía server). null nếu object không còn. */
async function saoLuuBackup(storagePath, id) {
  const tenCu = storagePath.split('/').pop();
  const ts = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
  const backupPath = `th-sua/backup/${ts}__${id}__${tenCu}`;
  try {
    return await moveFile(storagePath, backupPath);
  } catch {
    return null;
  }
}

export async function submitAssignment({ bai, phan, nguoi, file, link }) {
  if (file && link) throw new Error('Chỉ nộp một trong hai: tệp tin hoặc liên kết.');
  if (!file && !link) throw new Error('Chọn tệp báo cáo hoặc dán liên kết bài làm.');

  const id = submissionId(bai, phan);
  const cu = await getDoc(docSub(id));
  const cuData = cu.exists() ? cu.data() : null;
  const isOverwrite = cuData && cuData.status === 'active';
  if (isOverwrite && cuData.storagePath) {
    await saoLuuBackup(cuData.storagePath, id);
  }

  let payload;
  let detail;
  if (link) {
    const url = normalizeLink(link);
    payload = { kind: 'link', link: url, fileName: `Link ${nguonCuaLink(url)}`, size: null, storagePath: null };
    detail = `${payload.fileName}: ${url}${isOverwrite ? ' — bản cũ đã bị ghi đè' : ''}`;
  } else {
    if (file.size > MAX_FILE_BYTES) throw new Error(`File vượt 20MB (${formatBytes(file.size)}).`);
    const usage = await getUsage();
    if (usage + file.size > QUOTA_BYTES) {
      throw new Error(`Vượt trần 100MB của cả nhóm (đã dùng ${formatBytes(usage)}).`);
    }
    const fileName = tenFileAnToch(file.name);
    const storagePath = `th-sua/${id}/${fileName}`;
    await uploadFile(file, storagePath);
    payload = { kind: 'file', link: null, fileName, size: file.size, storagePath };
    /* Backup chỉ di chuyển byte nên usage net 0; mỗi lần nộp tệp mới thêm đúng size file mới. */
    await setDoc(doc(db, 'th-sua-meta/usage'), { totalBytes: increment(file.size), updatedAt: serverTimestamp() }, { merge: true });
    detail = `${fileName} (${formatBytes(file.size)})${isOverwrite ? ' — bản cũ đã vào backup' : ''}`;
  }

  await setDoc(
    docSub(id),
    {
      bai,
      phan: phan ?? null,
      tieuDe: nhannot(id),
      nguoi,
      ...payload,
      status: 'active',
      lanNop: (cuData?.lanNop ?? 0) + 1,
      submittedAt: cuData?.submittedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await ghiLog(isOverwrite ? 'nop_lai' : 'nop', id, nguoi[0], detail);
  return id;
}

export async function deleteSubmission(id, by) {
  const snap = await getDoc(docSub(id));
  if (!snap.exists() || snap.data().status !== 'active') throw new Error('Bài này chưa được nộp.');
  const data = snap.data();
  const backup = data.storagePath ? await saoLuuBackup(data.storagePath, id) : null;
  await updateDoc(docSub(id), { status: 'deleted', deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await ghiLog(
    'xoa',
    id,
    by,
    laLink(data)
      ? `Đã gỡ ${data.fileName} (liên kết, không có backup)`
      : `File ${data.fileName} đã chuyển vào backup${backup ? `: ${backup.to}` : ''}`,
  );
}
