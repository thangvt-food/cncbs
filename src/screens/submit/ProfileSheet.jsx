import { useEffect, useState } from 'react';
import { Sheet } from '../../components/Sheet';

export function ProfileSheet({ open, onClose, current, onSave }) {
  const [ten, setTen] = useState(current?.ten || '');
  const [mssv, setMssv] = useState(current?.mssv || '');

  useEffect(() => {
    setTen(current?.ten || '');
    setMssv(current?.mssv || '');
  }, [current, open]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!ten.trim() || !mssv.trim()) return;
    onSave?.({ ten: ten.trim(), mssv: mssv.trim() });
    onClose?.();
  };

  return (
    <Sheet title="Thông tin sinh viên" open={open} onClose={onClose}>
      <form onSubmit={handleSave} className="modal-body">
        <p className="meta" style={{ margin: 0 }}>
          Lưu tên và MSSV của bạn trên máy này để điền nhanh khi nộp bài.
        </p>
        <div className="field">
          <label className="field__label" htmlFor="me-ten">Họ và tên</label>
          <input
            id="me-ten"
            className="form-input"
            type="text"
            autoComplete="name"
            maxLength={60}
            placeholder="Ví dụ: Nguyễn Văn A"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="me-mssv">MSSV</label>
          <input
            id="me-mssv"
            className="form-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={15}
            placeholder="Ví dụ: 21127001"
            value={mssv}
            onChange={(e) => setMssv(e.target.value.trim())}
            required
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn--primary btn--sm" disabled={!ten.trim() || !mssv.trim()}>
            Lưu
          </button>
        </div>
      </form>
    </Sheet>
  );
}
