import { applyUpdate, deferUpdate, usePwa } from '../lib/pwa';

/* Bản mới đã tải xong nhưng chưa kích hoạt: hỏi ngay thay vì để máy chạy mã cũ. */
export function UpdateBanner() {
  const { needRefresh, applying, build } = usePwa();
  if (!needRefresh && !applying) return null;
  return (
    <div className="update" role="status" aria-live="polite">
      <p className="update__text">
        Có bản mới{build ? ` (${build})` : ''}. Cập nhật để dùng bản mới nhất.
      </p>
      <button
        type="button"
        className="btn btn--primary btn--sm update__go"
        onClick={applyUpdate}
        disabled={applying}
      >
        {applying ? 'Đang cập nhật…' : 'Cập nhật'}
      </button>
      {!applying && (
        <button type="button" className="update__later" onClick={deferUpdate}>
          Để sau
        </button>
      )}
    </div>
  );
}
