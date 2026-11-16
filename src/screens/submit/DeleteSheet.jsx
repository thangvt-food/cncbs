import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { deleteSubmission, laLink } from '../../lib/submissions';

export function DeleteSheet({ open, item, me, onClose, onDone, pushToast }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isLink = laLink(item?.sub);

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteSubmission(item.id, me);
      pushToast(isLink ? 'Đã gỡ liên kết đã nộp.' : 'Đã xoá file (đã lưu vào backup).');
      onDone();
      onClose();
    } catch (err) {
      setError(err?.message || 'Xoá thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Xoá bài nộp" open={open} onClose={onClose}>
      <div className="modal-body">
        <p className="meta" style={{ margin: 0 }}>
          {isLink ? (
            <>
              Gỡ liên kết đã nộp của <strong>{item?.nhiem}</strong>? Sau đó bạn có thể dán liên kết mới hoặc nộp tệp.
            </>
          ) : (
            <>
              Xoá bản nộp của <strong>{item?.nhiem}</strong>?
            </>
          )}
        </p>
        {error && <p className="alert-box alert-box--danger">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} disabled={busy}>
            Huỷ
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleDelete} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Xác nhận xoá'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
