/* Bộ đọc dùng localStorage cho dữ liệu nhỏ (cài đặt, tiến độ, đánh dấu, tô sáng).
   Bộ nhớ đầy hoặc chế độ ẩn danh thì ứng dụng vẫn đọc được, chỉ mất dữ liệu đã lưu. */

export function readKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
