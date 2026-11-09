import { Check } from './icons';
import { usePwa } from '../lib/pwa';

/* Một dòng xác nhận nội dung đã nằm trong máy: người dùng đọc lúc không có sóng cần biết
   trước rằng tài liệu mở được, chứ không phải thử và thấy trang trắng. */
export function OfflineChip({ className = '' }) {
  const { cached, supported } = usePwa();
  if (!supported || !cached) return null;
  return (
    <span className={`offline ${className}`.trim()}>
      <Check width={16} height={16} />
      Đã lưu để đọc offline
    </span>
  );
}
