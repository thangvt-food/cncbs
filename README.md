# Luyện thi Công nghệ Chế biến Sữa

Web ôn thi môn **Công nghệ Chế biến Sữa** (mã học phần **210339**): 160 câu hỏi từ 3 đề và một tài liệu đọc 7 chương (57.654 từ), chạy hoàn toàn phía trình duyệt, không cần backend.

## Chế độ

- **Luyện tập** — biết đúng/sai ngay sau mỗi câu, hiện đáp án đúng.
- **Thi thử** — đồng hồ đếm ngược, chỉ chấm khi nộp bài, hết giờ tự nộp.
- **Tài liệu đọc** — mở từ khối "Tài liệu đọc" ở trang chủ hoặc theo liên kết `#doc/<chương>`.

## Loại câu hỏi

Một đáp án · Đúng/Sai · Nhiều đáp án (chấm tuyệt đối theo tập đáp án) · Điền chỗ trống (chọn từ cho từng chỗ trong đoạn văn).

Đề "Nguyên lý Kỹ thuật Chế biến Thực phẩm" có 9 câu dạng nối (`matching_item`) về giản đồ pha nước. Loại này không có giao diện riêng nên script gộp toàn bộ đáp án của nhóm thành một danh sách chọn chung, mỗi câu thành một câu một đáp án — vẫn giữ đủ 48 câu.

## Tài liệu đọc

Bản tổng hợp lý thuyết từ phụ đề video của GV Lê Trung Thiên, mỗi file markdown một chương — hiện có bảy chương (Chương 1–7), Chương 7 là chương cuối của học phần.

- **Vị trí đọc** lưu theo `{chương, chỉ số khối, phần đã qua của khối}` chứ không lưu số trang hay toạ độ cuộn — đổi cỡ chữ, đổi font, xoay máy hay đổi thiết bị cùng trình duyệt thì vẫn về đúng đoạn đang đọc dở.
- **Cài đặt đọc**: cỡ chữ 14–28px, giãn dòng, bề ngang cột, bốn họ font (Literata, Noto Serif, EB Garamond, Be Vietnam Pro — đều có subset `vietnamese`), ba nền Sáng/Giấy/Tối (tương phản với chữ đều ≥ 4.5:1), căn lề, và hai cách đọc Cuộn dọc / Lật trang.
- **Đánh dấu trang**, **tô sáng từng câu kèm ghi chú**, **tìm kiếm** trong toàn bộ tài liệu (mặc định bỏ dấu, có thể bật "đúng dấu").
- **Lật trang** dùng CSS columns, một trang đúng bằng bề rộng khung chữ; vị trí vẫn là `{khối, tỷ lệ}` nên đổi cỡ chữ không mất chỗ đọc.
- **Offline**: service worker precache nội dung, font và icon; lần đọc thứ hai trở đi mở được khi mất mạng.
- Phím tắt trong màn đọc: `←` `→` chuyển chương hoặc lật trang, `Space` cuộn một màn, `T` mục lục, `A` cài đặt, `B` đánh dấu, `/` tìm, `Esc` đóng.

## Kỹ thuật

Vite 8 + React 19, không TypeScript, không router. Font Be Vietnam Pro, Barlow Condensed và ba serif đọc sách tự host kèm subset `vietnamese`; serif chỉ nạp khi người dùng chọn. Trạng thái bài làm và toàn bộ dữ liệu đọc (vị trí, cài đặt, đánh dấu, tô sáng) lưu vào `localStorage` nên đóng máy vẫn tiếp tục được. `marked` và `vite-plugin-pwa` chỉ chạy lúc build/ sinh dữ liệu, không phình bundle.

## Chạy local

```bash
npm install
npm run dev
npm run build && npm run preview
```

```bash
npm run data     # câu hỏi quiz  -> src/data/banks.json
npm run book     # tài liệu đọc  -> src/data/book/*.json
python3 scripts/make-icons.py   # icon PWA -> public/icons/
```

File sinh ra từ script được commit, vì vậy deploy chỉ cần `npm run build`.

## Dữ liệu

`data/sources/` giữ ba tệp nguồn xuất từ Gemini. `scripts/convert-data.mjs` chuẩn hoá chúng về `src/data/banks.json`; chạy `npm run data` sau khi thêm hoặc sửa tệp nguồn. Tên đề đặt trong `SOURCES` (`title`), không lấy theo `ten_de` trong tệp. Script vá được JSON bị cắt giữa chừng. Tệp không dùng nữa nằm ở `data/sources/archive/`.

| Đề | Nguồn | Số câu |
| --- | --- | --- |
| Thi giữa kỳ môn Sữa lần 1 | `gemini-code-1793867808816.json` | 60 |
| Thi giữa kỳ môn Sữa lần 2 | `gemini-code-1793869261405.json` | 52 |
| Kỹ thuật Thực phẩm 2 (giữa kỳ) | `gemini-code-1793874992421.json` | 48 |

Bốn chương tài liệu đọc ở `data/sources/book/`. `scripts/build-book.mjs` dùng `marked.lexer` chuyển markdown thành **khối có kiểu** (`heading`/`para`/`li`/`table`/`quote`/`hr`) rồi ghi một JSON cho mỗi chương vào `src/data/book/`; mỗi run chữ kèm offset trong `text` nên tô sáng và đánh dấu kết quả tìm không cần đến HTML thô. Tên chương khai báo trong `SOURCES` của script. Script in báo cáo số khối/bảng/từ từng chương và cảnh báo bảng lệch số cột.

Thêm chương mới và kiểm tra JSON có sẵn thành skill `.qoder/skills/build-book/`: `scripts/add-chapter.mjs <file.md> --title "..."` lo từ file md tới `SOURCES` tới build, còn `scripts/check-book.mjs` soi lại toàn bộ block model (offset của từng run, số cột bảng, mục lục, số liệu meta) và báo chênh lệch `blockCount` so với bản đã commit — thứ làm vị trí đọc và tô sáng của người dùng cũ nhảy sai chỗ.

| Chương | Nguồn | Từ |
| --- | --- | --- |
| 1 · Mở đầu — sản xuất và tiêu thụ sữa | `tong-hop-chuong-1-cong-nghe-che-bien-sua.md` | 2.585 |
| 2 · Cấu trúc, thành phần và sinh tổng hợp sữa | `tong-hop-chuong-2-cong-nghe-che-bien-sua.md` | 4.168 |
| 3 · Các cấu phần hoá học của sữa | `tong-hop-chuong-3-cong-nghe-che-bien-sua.md` | 5.047 |
| 4 · Tính chất vật lý và hoá lý của sữa | `tong-hop-chuong-4-cong-nghe-che-bien-sua.md` | 4.028 |

## Cấu trúc

```
index.html            điểm vào, font và meta
src/App.jsx           điều phối màn hình home / quiz / result, cộng màn đọc theo hash
src/screens/          Home, Quiz, Result, Reader
src/components/       Question, Navigator, Sheet, Toasts, icons,
                      blocks (render khối), ReadBar, ReadSheets, OfflineChip
src/lib/              quiz.js (BANKS, chấm điểm), hooks.js (localStorage),
                      book.js, progress.js, prefs.js, annotations.js, search.js,
                      fonts.js, router.js, store.js, pwa.js
src/data/banks.json   toàn bộ câu hỏi, sinh từ script
src/data/book/        một JSON mỗi chương, sinh từ script
src/styles/           tokens.css, base.css, app.css, reader.css
scripts/              convert-data.mjs, build-book.mjs, make-icons.py
data/sources/         tệp nguồn không đổi định dạng (book/ cho tài liệu đọc)
public/icons/         icon manifest PWA
```

## Giao diện

Quiz tuân thủ bộ quy cách trong `style.md`: bảng màu token (cinnabar là màu hành động duy nhất), 8 màu nhóm kèm hoa văn phân biệt được khi in đen trắng, thang font 40/24/16/14, bán kính 2/8/12/20, grid 3 cột trên desktop, thanh hành động dính dưới cùng trên mobile, focus ring nhìn thấy được, `prefers-reduced-motion` và dark mode.

Màn đọc theo bộ quy cách trong `SKILL.md` (ebook-webapp): trang chữ yên tĩnh không viền/đổ bóng/gradient, một màu nhấn, thang chuyển động 150–250ms, bảng luôn có vùng cuộn riêng để không ép cột chữ ngang màn hình, vùng chạm ≥ 44px, `100dvh` thay cho `100vh`.

## Triển khai

GitHub Pages với tên miền riêng `cncbs.yangio.id.vn` (`public/CNAME`), build bằng `.github/workflows/deploy.yml`.

Pages chỉ phục vụ tệp tĩnh nên deep link của tài liệu đọc đi qua hash (`#doc/ch2/41`); `dist` không cần rewrite nào và luồng quiz không ghi hash nên hành vi cũ không đổi. Service worker do `vite-plugin-pwa` sinh (`registerType: 'autoUpdate'`, `generateSW`) precache `**/*.{js,css,html,svg,png,woff,woff2,json}` — tức cả JSON từng chương và các họ font — nên từ lần mở thứ hai, tài liệu đọc được cả khi mất mạng. Ở chế độ dev không có service worker (`devOptions.enabled: false`).
