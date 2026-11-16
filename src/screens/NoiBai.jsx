import { useEffect, useState } from 'react';
import { closeDoc, openSubmit, openTongHop } from '../lib/router';
import { MAX_FILE_BYTES, TH_SUA_BAI, formatBytes, listSubmissions, nhannot, submissionId, submitAssignment } from '../lib/submissions';
import { readKey, writeKey } from '../lib/store';
import '../styles/submit.css';

function NguoiField({ label, value, onChange }) {
  return (
    <div className="field submit__nguoi">
      <span className="field__label">{label}</span>
      <input
        type="text"
        placeholder="Họ và tên"
        value={value.ten}
        onChange={(e) => onChange({ ...value, ten: e.target.value })}
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="MSSV"
        value={value.mssv}
        onChange={(e) => onChange({ ...value, mssv: e.target.value.trim() })}
      />
    </div>
  );
}

function FormNop({ bai, phan, pushToast }) {
  const me = readKey('thsua:me', { ten: '', mssv: '' });
  [me.ten, me.mssv] = [String(me.ten || ''), String(me.mssv || '')];

  const [nguoi1, setNguoi1] = useState({ ...me });
  const [nguoi2, setNguoi2] = useState({ ten: '', mssv: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState('');

  const nhieuNguoi = !bai.phans;
  const tenTruyCap = bai.phans ? `${phan}. ` : '';
  const mucTieu = submissionId(bai.bai, bai.phans ? phan : null);
  const nop = async () => {
    setLoi('');
    if (!nguoi1.ten.trim() || !nguoi1.mssv.trim()) {
      setLoi('Nhập đầy đủ tên và MSSV.');
      return;
    }
    const nguoi = [{ ten: nguoi1.ten.trim(), mssv: nguoi1.mssv.trim() }];
    if (nhieuNguoi) {
      if (!nguoi2.ten.trim() || !nguoi2.mssv.trim()) {
        setLoi('Bài này 2 người viết — nhập tên và MSSV cả người còn lại.');
        return;
      }
      nguoi.push({ ten: nguoi2.ten.trim(), mssv: nguoi2.mssv.trim() });
    }
    if (!file) {
      setLoi('Chọn file báo cáo trước đã.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setLoi(`File ${formatBytes(file.size)} vượt trần 20MB.`);
      return;
    }
    setBusy(true);
    try {
      writeKey('thsua:me', nguoi[0]);
      await submitAssignment({ bai: bai.bai, phan: bai.phans ? phan : null, nguoi, file });
      pushToast(`Đã nộp ${nhannot(mucTieu)}.`);
      openTongHop();
    } catch (e) {
      setLoi(e?.message || 'Nộp thất bại — kiểm tra mạng rồi thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel submit__form">
      <h2 className="submit__h2">
        {tenTruyCap}
        {bai.phans ? bai.phans.find((p) => p.phan === phan).ten : bai.tieuDe}
      </h2>
      <p className="meta">{bai.moTa}</p>

      <NguoiField label="Người nộp / người viết 1" value={nguoi1} onChange={setNguoi1} />
      {nhieuNguoi && <NguoiField label="Người viết 2" value={nguoi2} onChange={setNguoi2} />}

      <div className="field">
        <span className="field__label">File báo cáo (tối đa 20MB)</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setLoi('');
          }}
        />
        {file && (
          <p className="field__note">
            {file.name} · {formatBytes(file.size)}
          </p>
        )}
      </div>

      {nhieuNguoi && <p className="field__note">Nộp lại sẽ tự sao lưu bản cũ vào thùng backup và ghi nhật ký.</p>}
      {loi && <p className="submit__loi">{loi}</p>}

      <div className="submit__actions">
        <button type="button" className="btn btn--ghost" onClick={() => openSubmit(bai.bai)} disabled={busy}>
          Quay lại
        </button>
        <button type="button" className="btn btn--primary" onClick={nop} disabled={busy}>
          {busy ? 'Đang nộp…' : 'Nộp bài'}
        </button>
      </div>
    </div>
  );
}

export function NoiBai({ route, pushToast }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0 });
    listSubmissions().then(setStatus).catch(() => {});
  }, [route]);

  const bai = route?.bai ? TH_SUA_BAI.find((b) => b.bai === route.bai) : null;

  let content;
  if (!bai) {
    content = (
      <div className="submit__list">
        {TH_SUA_BAI.map((b) => {
          const daNop = b.phans
            ? b.phans.filter((p) => status[submissionId(b.bai, p.phan)]?.status === 'active').length
            : status[submissionId(b.bai)]?.status === 'active'
              ? 1
              : 0;
          const tong = b.phans ? b.phans.length : 1;
          return (
            <button type="button" key={b.bai} className="submit__row" onClick={() => openSubmit(b.bai)}>
              <span className="submit__row-num num">Bài {b.bai}</span>
              <span className="submit__row-main">
                <span className="submit__row-title">{b.tieuDe}</span>
                <span className="meta">{b.moTa}</span>
              </span>
              <span className="chip" data-done={String(daNop === tong)}>
                {daNop}/{tong}
              </span>
            </button>
          );
        })}
      </div>
    );
  } else if (bai.phans && !route.phan) {
    content = (
      <div className="submit__list">
        {bai.phans.map((p) => {
          const s = status[submissionId(bai.bai, p.phan)];
          const active = s?.status === 'active';
          return (
            <button type="button" key={p.phan} className="submit__row" onClick={() => openSubmit(bai.bai, p.phan)}>
              <span className="submit__row-num num">{p.phan}</span>
              <span className="submit__row-main">
                <span className="submit__row-title">{p.ten}</span>
                {active && (
                  <span className="meta">
                    Đã nộp: {s.nguoi?.[0]?.ten} ({s.nguoi?.[0]?.mssv}) — {s.fileName}
                  </span>
                )}
              </span>
              <span className="chip" data-done={String(active)}>
                {active ? 'Đã nộp' : 'Chưa nộp'}
              </span>
            </button>
          );
        })}
      </div>
    );
  } else if (bai.phans && route.phan) {
    content = <FormNop bai={bai} phan={route.phan} pushToast={pushToast} />;
  } else {
    const s = status[submissionId(bai.bai)];
    content = (
      <>
        {s?.status === 'active' && (
          <p className="submit__dahave panel">
            Bài này đã nộp bởi{' '}
            <strong>
              {s.nguoi?.map((n) => `${n.ten} (${n.mssv})`).join(' + ')}
            </strong>{' '}
            — {s.fileName}. Nộp lại sẽ sao lưu bản cũ.
          </p>
        )}
        <FormNop bai={bai} phan={null} pushToast={pushToast} />
      </>
    );
  }

  return (
    <div className="wrap submit">
      <div className="submit__head">
        <button type="button" className="btn btn--ghost btn--sm" onClick={closeDoc}>
          ← Trang chủ
        </button>
        <h1 className="submit__h1">Nộp bài thực hành — Chế biến Sữa</h1>
        <button type="button" className="btn btn--ghost btn--sm" onClick={openTongHop}>
          Bảng tổng hợp
        </button>
      </div>
      {content}
    </div>
  );
}
