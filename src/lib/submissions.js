/* Data layer cho form nộp bài TH Công nghệ chế biến sữa.
   Firestore: th-sua-submissions/{id}, th-sua-logs/{pushId}, th-sua-meta/usage.
   Storage:   th-sua/{id}/{file} (bản active), th-sua/backup/{ts}__{id}__{file} (bản bị xoá/ghi đè).
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
import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';

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
    moTa: 'Buổi học tại lớp 104 Cẩm Tú — 8 phần, mỗi người một phần.',
    phans: PHANS_BAI_1.map((ten, i) => ({ phan: `1.${i + 1}`, ten })),
  },
  {
    bai: 2,
    tieuDe: 'Sản xuất sữa chua lên men dạng đặc',
    moTa: 'Buổi thực hành tại xưởng — 2 người viết, 1 người nộp đại.',
  },
  {
    bai: 3,
    tieuDe: 'Sản xuất kem tươi',
    moTa: 'Buổi thực hành tại xưởng — 2 người viết, 1 người nộp đại.',
  },
  {
    bai: 4,
    tieuDe: 'Sản xuất kem caramel (bánh flan)',
    moTa: 'Buổi thực hành tại xưởng — 2 người viết, 1 người nộp đại.',
  },
  {
    bai: 5,
    tieuDe: 'Tổng hợp các sản phẩm sữa trên thị trường hiện nay',
    moTa: 'Bài tổng hợp — 2 người viết, 1 người nộp đại.',
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

function tenFileAnToch(name) {
  const clean = String(name || 'bai-lam.docx').replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^_+|_+$/g, '');
  return (clean || 'bai-lam').slice(0, 120);
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

/* Chuyển một object trong storage sang thùng backup kèm timestamp. Trả về path backup, null nếu object không còn. */
async function saoLuuBackup(storagePath, id) {
  const src = ref(storage, storagePath);
  let blob;
  try {
    blob = await getBlob(src);
  } catch {
    return null;
  }
  const tenCu = storagePath.split('/').pop();
  const ts = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
  const backupPath = `th-sua/backup/${ts}__${id}__${tenCu}`;
  await uploadBytes(ref(storage, backupPath), blob, { contentType: blob.type || undefined });
  await deleteObject(src);
  return { backupPath, size: blob.size };
}

export async function submitAssignment({ bai, phan, nguoi, file }) {
  if (!file) throw new Error('Chọn file báo cáo trước đã.');
  if (file.size > MAX_FILE_BYTES) throw new Error(`File vượt 20MB (${formatBytes(file.size)}).`);

  const id = submissionId(bai, phan);
  const usage = await getUsage();
  if (usage + file.size > QUOTA_BYTES) {
    throw new Error(`Vượt trần 100MB của cả nhóm (đã dùng ${formatBytes(usage)}).`);
  }

  const cu = await getDoc(docSub(id));
  const ghiDe = cu.exists() && cu.data().status === 'active';
  if (ghiDe) await saoLuuBackup(cu.data().storagePath, id);

  const fileName = tenFileAnToch(file.name);
  const storagePath = `th-sua/${id}/${fileName}`;
  await uploadBytes(ref(storage, storagePath), file, { contentType: file.type || undefined });
  await setDoc(
    docSub(id),
    {
      bai,
      phan: phan ?? null,
      tieuDe: nhannot(id),
      nguoi,
      fileName,
      size: file.size,
      storagePath,
      status: 'active',
      lanNop: ghiDe ? (cu.data().lanNop ?? 1) + 1 : 1,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  /* Backup/rename chỉ di chuyển byte nên usage net 0; mỗi lần nộp mới thêm đúng size file mới. */
  await setDoc(doc(db, 'th-sua-meta/usage'), { totalBytes: increment(file.size), updatedAt: serverTimestamp() }, { merge: true });
  await ghiLog(ghiDe ? 'nop_lai' : 'nop', id, nguoi[0], `${fileName} (${formatBytes(file.size)})${ghiDe ? ' — bản cũ đã vào backup' : ''}`);
  return id;
}

export async function renameSubmission(id, newName, by) {
  const snap = await getDoc(docSub(id));
  if (!snap.exists() || snap.data().status !== 'active') throw new Error('Bài này chưa được nộp.');
  const old = snap.data();
  const tenCu = old.fileName;
  const fileName = tenFileAnToch(newName);
  if (fileName === tenCu) return;

  const usage = await getUsage();
  if (usage + old.size > QUOTA_BYTES) throw new Error('Không đủ dung lượng 100MB để tạo bản đổi tên.');

  const blob = await getBlob(ref(storage, old.storagePath));
  const storagePath = `th-sua/${id}/${fileName}`;
  await uploadBytes(ref(storage, storagePath), blob, { contentType: blob.type || undefined });
  await deleteObject(ref(storage, old.storagePath));
  await updateDoc(docSub(id), { fileName, storagePath, updatedAt: serverTimestamp() });
  await ghiLog('doi_ten', id, by, `"${tenCu}" → "${fileName}"`);
}

export async function deleteSubmission(id, by) {
  const snap = await getDoc(docSub(id));
  if (!snap.exists() || snap.data().status !== 'active') throw new Error('Bài này chưa được nộp.');
  const backup = await saoLuuBackup(snap.data().storagePath, id);
  await updateDoc(docSub(id), { status: 'deleted', deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await ghiLog('xoa', id, by, `File đã chuyển vào backup${backup ? `: ${backup.backupPath}` : ''}`);
}

export async function downloadUrl(id) {
  const snap = await getDoc(docSub(id));
  if (!snap.exists() || snap.data().status !== 'active') throw new Error('Bài này chưa được nộp.');
  return getDownloadURL(ref(storage, snap.data().storagePath));
}
