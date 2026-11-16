import { useCallback, useEffect, useState } from 'react';
import { closeDoc, openSubmit } from '../lib/router';
import {
  QUOTA_BYTES,
  TH_SUA_BAI,
  formatBytes,
  getLogs,
  getUsage,
  listSubmissions,
  downloadUrl,
  renameSubmission,
  deleteSubmission,
} from '../lib/submissions';
import { readKey } from '../lib/store';
import { Sheet } from '../components/Sheet';
import '../styles/submit.css';

function dongHo(ts) {
  if (!ts?.seconds) return '—';
  return new Date(ts.seconds * 1000).toLocaleString('vi-VN', { hour12: false });
}

const ACTION_LABEL = { nop: 'nộp bài', nop_lai: 'nộp lại (bản cũ vào backup)', xoa: 'xoá (vào backup)', doi_ten: 'đổi tên' };

/* 'bai1.3' → mở form phần 1.3; 'bai4' → mở form bài 4. */
function moFormNop(id) {
  const m = /^bai(\d)((?:\.\d)?)$/.exec(id);
  if (!m) return;
  openSubmit(Number(m[1]), m[2] ? `1${m[2]}` : null);
}

function Dong({ id, nhiem, sub, refresh, pushToast }) {
  const me = readKey('thsua:me', null);
  const [menu, setMenu] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const active = sub?.status === 'active';

  const tai = async () => {
    try {
      window.open(await downloadUrl(id), '_blank', 'noopener');
    } catch (e) {
      pushToast(e?.message || 'Không tải được file.');
    }
  };

  const doiTen = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await renameSubmission(id, newName.trim(), me);
      pushToast('Đã đổi tên file.');
      setMenu(false);
      refresh();
    } catch (e) {
      pushToast(e?.message || 'Đổi tên thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const xoa = async () => {
    if (!window.confirm(`Xoá ${id}? Bản cũ được chuyển vào thùng backup, không mất hẳn.`)) return;
    setBusy(true);
    try {
      await deleteSubmission(id, me);
      pushToast('Đã xoá — file nằm trong backup.');
      setMenu(false);
      refresh();
    } catch (e) {
      pushToast(e?.message || 'Xoá thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="th__row panel" data-done={String(active)}>
      <span className="th__check" aria-hidden="true" data-on={String(active)} />
      <span className="th__main">
        <span className="th__title">{nhiem}</span>
        {active ? (
          <span className="meta">
            {sub.nguoi?.map((n) => `${n.ten} (${n.mssv})`).join(' + ')} · {sub.fileName} ·{' '}
            {formatBytes(sub.size)} · nộp {dongHo(sub.submittedAt)}
          </span>
        ) : (
          <span className="th__thieu">Chưa nộp</span>
        )}
      </span>
      <span className="th__actions">
        {active ? (
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={tai}>
              Tải
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setMenu((v) => !v);
                setNewName(sub.fileName);
              }}
            >
              ⋮
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--sm" onClick={() => moFormNop(id)}>
            Nộp
          </button>
        )}
      </span>
      {menu && active && (
        <div className="th__menu">
          <div className="field">
            <span className="field__label">Đổi tên file</span>
            <div className="th__rename">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button type="button" className="btn btn--sm btn--primary" onClick={doiTen} disabled={busy}>
                Lưu
              </button>
            </div>
          </div>
          <button type="button" className="btn btn--sm th__xoa" onClick={xoa} disabled={busy}>
            Xoá bài (vào backup)
          </button>
        </div>
      )}
    </div>
  );
}

export function TongHop({ pushToast }) {
  const [subs, setSubs] = useState(null);
  const [usage, setUsage] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loai, setLoai] = useState('');
  const [showLog, setShowLog] = useState(false);

  const refresh = useCallback(() => {
    listSubmissions()
      .then(setSubs)
      .catch((e) => setLoai(e?.message || 'Không đọc được Firestore — kiểm tra rules/mạng.'));
    getUsage().then(setUsage).catch(() => {});
    getLogs().then(setLogs).catch(() => {});
  }, []);

  useEffect(refresh, [refresh]);

  const thieu = [];
  for (const b of TH_SUA_BAI) {
    if (b.phans) {
      for (const p of b.phans) {
        const s = subs?.[`bai${p.phan}`];
        if (s?.status !== 'active') thieu.push(`1.${p.phan} ${p.ten}`);
      }
    } else {
      const s = subs?.[`bai${b.bai}`];
      if (s?.status !== 'active') thieu.push(`Bài ${b.bai} — ${b.tieuDe}`);
    }
  }

  return (
    <div className="wrap submit">
      <div className="submit__head">
        <button type="button" className="btn btn--ghost btn--sm" onClick={closeDoc}>
          ← Trang chủ
        </button>
        <h1 className="submit__h1">Tổng hợp nộp bài</h1>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowLog(true)}>
          Nhật ký ({logs.length})
        </button>
      </div>

      {loai && <p className="submit__loi">{loai}</p>}

      <div className="th__meta panel">
        <p className="meta">
          Dung lượng đã dùng <span className="num">{formatBytes(usage)}</span> / {formatBytes(QUOTA_BYTES)} ·{' '}
          {subs ? (thieu.length ? <span className="th__thieu">Còn thiếu {thieu.length} mục</span> : 'Đủ bài rồi') : 'Đang tải…'}
        </p>
        <button type="button" className="btn btn--ghost btn--sm" onClick={refresh}>
          Làm mới
        </button>
      </div>

      {TH_SUA_BAI.map((b) => {
        const items = b.phans
          ? b.phans.map((p) => ({ id: `bai${p.phan}`, nhiem: `${p.phan}. ${p.ten}` }))
          : [{ id: `bai${b.bai}`, nhiem: `Bài ${b.bai}. ${b.tieuDe}` }];
        return (
          <section key={b.bai} className="th__group">
            {b.phans && <h2 className="submit__h2">{`Bài ${b.bai}. ${b.tieuDe}`}</h2>}
            {items.map((it) => (
              <Dong key={it.id} id={it.id} nhiem={it.nhiem} sub={subs?.[it.id]} refresh={refresh} pushToast={pushToast} />
            ))}
          </section>
        );
      })}

      <Sheet title="Nhật ký nộp bài" open={showLog} onClose={() => setShowLog(false)}>
        <ul className="th__logs">
          {logs.length === 0 && <li className="meta">Chưa có hoạt động nào.</li>}
          {logs.map((l) => (
            <li key={l.id} className="th__log">
              <span className="num th__log-time">{dongHo(l.at)}</span>
              <span>
                <strong>{ACTION_LABEL[l.action] || l.action}</strong> · {l.targetLabel}
                {l.by ? ` — ${l.by.ten} (${l.by.mssv})` : ''}
                {l.detail ? <span className="meta"> · {l.detail}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
