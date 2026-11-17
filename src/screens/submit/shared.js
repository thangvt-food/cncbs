import { TH_SUA_BAI, submissionId } from '../../lib/submissions';

export const ACTION_LABEL = {
  nop: 'Nộp mới',
  nop_lai: 'Nộp lại',
  doi_ten: 'Đổi tên',
  xoa: 'Xoá',
};

export function formatTimestamp(ts) {
  if (!ts) return '—';
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString('vi-VN', { hour12: false });
  }
  if (typeof ts === 'number' || ts instanceof Date) {
    return new Date(ts).toLocaleString('vi-VN', { hour12: false });
  }
  return '—';
}

export function isSafeHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function tinhTienSu(subs = {}) {
  const safeSubs = subs || {};
  const thieu = [];
  let done = 0;
  let total = 0;
  for (const b of TH_SUA_BAI) {
    const danhsach = b.phans
      ? b.phans.map((p) => ({ bai: b.bai, phan: p.phan, label: `${p.phan} ${p.ten}` }))
      : [{ bai: b.bai, phan: null, label: `Bài ${b.bai}: ${b.tieuDe}` }];
    for (const it of danhsach) {
      total += 1;
      const id = submissionId(it.bai, it.phan);
      if (safeSubs[id]?.status === 'active') done += 1;
      else thieu.push({ ...it, id });
    }
  }
  return { thieu, done, total };
}

export function pageTitle(baiObj, phan) {
  if (!baiObj) return '';
  const p = phan ? baiObj.phans?.find((x) => x.phan === phan) : null;
  return p ? `Phần ${phan}: ${p.ten}` : `Bài ${baiObj.bai}: ${baiObj.tieuDe}`;
}
