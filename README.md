# Luyện thi Chế biến Thực phẩm

Web quiz ôn thi môn Chế biến Thực phẩm: 197 câu hỏi từ 4 đề, chạy hoàn toàn phía trình duyệt, không cần backend.

## Chế độ

- **Luyện tập** — biết đúng/sai ngay sau mỗi câu, hiện đáp án đúng.
- **Thi thử** — đồng hồ đếm ngược, chỉ chấm khi nộp bài, hết giờ tự nộp.

## Loại câu hỏi

Một đáp án · Đúng/Sai · Nhiều đáp án (chấm tuyệt đối theo tập đáp án) · Điền chỗ trống (chọn từ cho từng chỗ trong đoạn văn).

## Kỹ thuật

Vite 8 + React 19, không TypeScript. Font Be Vietnam Pro và Barlow Condensed tự host kèm subset `vietnamese`. Trạng thái bài làm lưu vào `localStorage` nên đóng máy vẫn tiếp tục được.

## Chạy local

```bash
npm install
npm run dev
npm run build && npm run preview
```

## Dữ liệu

Nguồn là 3 file JSON xuất từ Gemini. `scripts/convert-data.mjs` chuẩn hoá về `src/data/banks.json` (chạy `npm run data` sau khi sửa đường dẫn nguồn trong script). File chuyển đổi cũng vá được JSON bị cắt giữa chừng.

## Giao diện

Tuân thủ bộ quy cách trong `style.md`: bảng màu token (cinnabar là màu hành động duy nhất), 8 màu nhóm kèm hoa văn phân biệt được khi in đen trắng, thang font 40/24/16/14, bán kính 2/8/12/20, grid 3 cột trên desktop, thanh hành động dính dưới cùng trên mobile, focus ring nhìn thấy được, `prefers-reduced-motion` và dark mode.

## Triển khai

GitHub Pages với tên miền riêng `cncbs.yangio.id.vn` (`public/CNAME`), build bằng `.github/workflows/deploy.yml`.
