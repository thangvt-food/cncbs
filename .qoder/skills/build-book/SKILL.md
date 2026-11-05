---
name: build-book
description: Tạo và cập nhật JSON tài liệu đọc cho app cncbS từ markdown (block model trong src/data/book). Dùng khi thêm chương mới, sửa nội dung markdown, đổi tên đề mục, khi JSON nghi lệch so với markdown, hoặc khi vị trí đọc / tô sáng trong màn đọc nhảy sai chỗ sau một lần sửa nguồn.
---

# Build tài liệu đọc (markdown → JSON)

## Overview

Các file markdown trong `data/sources/book/` được `scripts/build-book.mjs` (marked.lexer) chuyển thành **khối có kiểu**, một JSON mỗi chương trong `src/data/book/`. App chỉ đọc JSON; markdown nguồn không hề được nạp lúc chạy. Vì vậy mọi thay đổi nội dung phải đi qua script, không sửa tay JSON.

Toàn bộ màn đọc (danh sách chương, mục lục, tìm kiếm, tiến độ, rail đánh dấu) suy ra từ `src/data/book/index.json`, nên **thêm chương không cần sửa code** — chỉ cần markdown + một dòng `SOURCES` + chạy script.

## Bốn việc thường gặp

| Việc | Làm |
| --- | --- |
| Thêm chương mới | `node .qoder/skills/build-book/scripts/add-chapter.mjs <file.md> --title "..."` |
| Sửa nội dung một chương | sửa `data/sources/book/*.md` → `npm run book` → `node .qoder/skills/build-book/scripts/check-book.mjs` |
| Chỉ kiểm tra JSON hiện tại | `node .qoder/skills/build-book/scripts/check-book.mjs` |
| JSON sinh ra có đáng nghi | xem mục "Báo cáo của script" và "Vị trí đọc bị lệch" dưới đây |

## Thêm chương mới

`add-chapter.mjs` kiểm tra file md, chép vào `data/sources/book/`, cắm một mục tử vào mảng `SOURCES` trong `scripts/build-book.mjs`, rồi chạy `npm run book` và `check-book.mjs`. Cờ: `--id ch7` (mặc định lấy số tiếp theo), `--dry` (in dòng sẽ chèn, không ghi), `--force` (ghi đè file trùng tên), `--at <i>` (chèn vào giữa, ví dụ chèn chương phụ lục trước chương 4).

Không dùng script thì tự làm đúng bốn bước:

1. Đặt file md vào `data/sources/book/`. File phải mở đầu bằng một dòng `# ` (H1 — bị bỏ vì trùng tiêu đề chương) và có ít nhất một `## `.
2. Thêm vào `SOURCES` trong `scripts/build-book.mjs`: `{ id: 'ch7', file: '<tên-file>.md', title: '...' }`. `title` **không** lấy từ file; `id` phải khớp `/^ch\d+$/` và chưa dùng.
3. `npm run book`.
4. `node .qoder/skills/build-book/scripts/check-book.mjs` rồi mở `npm run dev` → `#doc/ch7` đọc thử một vòng.

Chèn chương vào giữa làm chỉ số khối của chương đó dịch toàn bộ → xem "Vị trí đọc bị lệch".

## Hợp đồng dữ liệu

```
src/data/book/index.json  { generatedAt, book: { id,title,author,note, chapters:[meta] } }
src/data/book/chN.json    { id, blocks:[block] }
```

`meta`: `id, no, title, short, words, blockCount, parts, tables, maxCols, toc:[{lv,block,text}]` (`toc` chỉ gồm heading có `lv > 1`).

`block` luôn có `n` (chỉ số khối, đúng thứ tự tài liệu) và `text` (plain text để tìm kiếm/tính tiến độ) và `w` (số từ của `text`):

| `t` | thêm | ghi chú |
| --- | --- | --- |
| `h` | `lv` 1–4, `runs` | `lv` = độ sâu heading − 1; `lv 1` thường là `PHẦN n —` |
| `p` | `runs` | một dòng mềm = một khối; `intro: 1` cho khối trước heading đầu (Reader dựng chữ nhỏ) |
| `quote` | `runs` | blockquote |
| `list` | `ol, start, items:[{depth, runs}]` | mỗi `li` là một `items` trong cùng một khối; `depth` đã chuẩn hoá theo khối (xem "Depth của danh sách lồng") |
| `table` | `cols:[runs]`, `rows:[[runs]]`, `align` | số cột mọi dòng phải bằng `cols.length` |
| `hr` | — | `text` rỗng, `w` 0 |

`runs` = `{ x, o, b?, i?, c?, s?, href? }` với `o` = offset của `x` trong `block.text`. `o` là thứ runtime cần để ánh xạ selection trong DOM về khoảng `[start, end]` của tô sáng, nên **không được tự nối `text` kiểu khác** ở bất kỳ đâu.

## Depth của danh sách lồng

Màn đọc dựng cây `<ul>/<ol>` từ chuỗi `depth` (`buildNodes` trong `src/components/blocks.jsx`), nên một khối `list` phải có món đầu ở `depth 0` và mỗi món sau không sâu hơn món trước quá một cấp. Markdown nguồn hay phá vỡ điều này: danh sách con thụt lề ngay dưới heading, hoặc bullet cha bị tách sang khối khác vì dòng mềm — khi đó `depth` tuyệt đối bắt đầu ở 1 hoặc nhảy từ 0 lên 2, và **món lạc loài đó biến mất khỏi màn hình mà JSON vẫn còn nguyên**. `normalizeDepths()` trong `scripts/build-book.mjs` nắn lại theo từng khối; `check-book.mjs` báo FAIL nếu khối nào còn vi phạm. Vì vậy không sửa `depth` tay trong JSON, và khi thấy chữ thiếu trên màn đọc thì kiểm `depth` trước khi tìm đâu xa.

## Báo cáo của script

`npm run book` in mỗi chương một dòng (`từ / khối / phần / mục lục / bảng / KB`) rồi bốn cảnh báo, và cả bốn đều phải được đọc hết trước khi commit:

- `BẢNG LỆNH SỐ CỘT` — markdown có dòng thiếu `|`; bảng vỡ trên mobile. Sửa nguồn, không sửa output.
- `TỪ NGUỒN KHÔNG CÓ TRONG OUTPUT` — marked ăn mất chữ. Hay gặp nhất là `A < B`, `</` hoặc `**` lạc chỗ bị coi là tag HTML (đã biết: `<200.000/mL**, …, viêm vú **`). Escape bằng `&lt;` hoặc viết lại câu.
- `BỎ QUA` — loại token script chưa xử lý (`html:` là nguồn có HTML thô, cần bỏ khỏi md).
- `URL rút gọn nhãn` / `paragraph tách dòng mềm` — chỉ để đối chiếu khi số khối thay đổi bất ngờ.

Ba chỗ `**_*` lồng hỏng trong nguồn (ch2 `alveoli`, ch3 `Bifidobacterium`, ch4 `Lactobacillus`) được chấp nhận render nguyên trạng; đừng "vá" bằng cách sửa output.

## Vị trí đọc bị lệch

Vị trí đọc lưu `{chương, chỉ số khối, tỉ lệ trong khối}` (`localStorage` key `cncb-book.progress.v1`), tô sáng lưu `{block, start, end}` (`cncb-book.hl.v1`), đánh dấu lưu `{block, text}` (`cncb-book.marks.v1`). Hệ quả:

- **Chèn/xoá nội dung trước một khối** làm chỉ số khối dịch → chỗ đọc và tô sáng nhảy sang đoạn khác. Với sửa nhỏ trong một đoạn thì offset vẫn đúng; với thêm đoạn mới ở giữa chương thì người dùng cũ sẽ lệch.
- **Sửa chữ trong một đoạn đã có tô sáng** làm `start/end` lệch nếu độ dài thay đổi.
- `check-book.mjs` so `blockCount` và `words` với bản đã commit trong git và in bảng chênh lệch để biết mức độ ảnh hưởng. Nếu chênh nhiều, chấp nhận: Reader đã kẹp `block` về khối cuối hợp lệ khi mở chương, và `text` của bookmark vẫn dùng để dò lại.

## Nghiệm thu sau mỗi lần đổi

1. `npm run book` — báo cáo sạch (hoặc giải thích được từng cảnh báo).
2. `node .qoder/skills/build-book/scripts/check-book.mjs` — `0 vấn đề`.
3. `npm run dev` → `#doc/chN` (chương mới/sửa): dựng đủ khối, vào được giữa chương bằng mục lục, tìm kiếm ra kết quả trong chương đó.
4. `npm run build` — JSON chương mới phải nằm trong precache (`precache N entries` tăng; file `dist/assets/chN-*.js` xuất hiện).

## Resources

- `scripts/add-chapter.mjs` — thêm chương: kiểm md, chép vào `data/sources/book/`, cắm mục tử vào `SOURCES`, build, check.
- `scripts/check-book.mjs` — soi toàn bộ `src/data/book/*.json` (schema, offset, bảng, mục lục, số liệu meta) và chênh lệch so với bản đã commit.
