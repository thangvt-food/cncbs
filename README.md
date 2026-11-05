# Luyện thi Công nghệ Chế biến Sữa

Web quiz ôn thi môn **Công nghệ Chế biến Sữa** (mã học phần **210339**): 160 câu hỏi từ 3 đề, chạy hoàn toàn phía trình duyệt, không cần backend.

## Chế độ

- **Luyện tập** — biết đúng/sai ngay sau mỗi câu, hiện đáp án đúng.
- **Thi thử** — đồng hồ đếm ngược, chỉ chấm khi nộp bài, hết giờ tự nộp.

## Loại câu hỏi

Một đáp án · Đúng/Sai · Nhiều đáp án (chấm tuyệt đối theo tập đáp án) · Điền chỗ trống (chọn từ cho từng chỗ trong đoạn văn).

Đề "Nguyên lý Kỹ thuật Chế biến Thực phẩm" có 9 câu dạng nối (`matching_item`) về giản đồ pha nước. Loại này không có giao diện riêng nên script gộp toàn bộ đáp án của nhóm thành một danh sách chọn chung, mỗi câu thành một câu một đáp án — vẫn giữ đủ 48 câu.

## Kỹ thuật

Vite 8 + React 19, không TypeScript. Font Be Vietnam Pro và Barlow Condensed tự host kèm subset `vietnamese`. Trạng thái bài làm lưu vào `localStorage` nên đóng máy vẫn tiếp tục được.

## Chạy local

```bash
npm install
npm run dev
npm run build && npm run preview
```

## Dữ liệu

`data/sources/` giữ ba tệp nguồn xuất từ Gemini. `scripts/convert-data.mjs` chuẩn hoá chúng về `src/data/banks.json`; chạy `npm run data` sau khi thêm hoặc sửa tệp nguồn. Tên đề đặt trong `SOURCES` (`title`), không lấy theo `ten_de` trong tệp. Script vá được JSON bị cắt giữa chừng. Tệp không dùng nữa nằm ở `data/sources/archive/`.

| Đề | Nguồn | Số câu |
| --- | --- | --- |
| Thi giữa kỳ môn Sữa lần 1 | `gemini-code-1793867808816.json` | 60 |
| Thi giữa kỳ môn Sữa lần 2 | `gemini-code-1793869261405.json` | 52 |
| Kỹ thuật Thực phẩm 2 (giữa kỳ) | `gemini-code-1793874992421.json` | 48 |

## Cấu trúc

```
index.html            điểm vào, font và meta
src/App.jsx           điều phối màn hình home / quiz / result
src/screens/          Home, Quiz, Result
src/components/       Question, Navigator, Sheet, Toasts, icons
src/lib/              quiz.js (BANKS, chấm điểm), hooks.js (localStorage)
src/data/banks.json   toàn bộ câu hỏi, sinh từ script
src/styles/           tokens.css, base.css, app.css
scripts/              convert-data.mjs
data/sources/         tệp nguồn không đổi định dạng
materials/            slide, đề kiểm tra, hồ sơ cá nhân — không commit
```

## Giao diện

Tuân thủ bộ quy cách trong `style.md`: bảng màu token (cinnabar là màu hành động duy nhất), 8 màu nhóm kèm hoa văn phân biệt được khi in đen trắng, thang font 40/24/16/14, bán kính 2/8/12/20, grid 3 cột trên desktop, thanh hành động dính dưới cùng trên mobile, focus ring nhìn thấy được, `prefers-reduced-motion` và dark mode.

## Triển khai

GitHub Pages với tên miền riêng `cncbs.yangio.id.vn` (`public/CNAME`), build bằng `.github/workflows/deploy.yml`.
