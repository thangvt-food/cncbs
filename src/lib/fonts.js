/* Font đọc: serif có subset tiếng Việt, tự host. Khai báo @font-face ở đây chỉ là CSS text —
   woff2 của font không về máy người dùng trừ khi họ chọn font đó, nên bốn họ cùng lúc vẫn nhẹ. */
import '@fontsource/literata/latin-400.css';
import '@fontsource/literata/vietnamese-400.css';
import '@fontsource/literata/latin-400-italic.css';
import '@fontsource/literata/vietnamese-400-italic.css';
import '@fontsource/literata/latin-700.css';
import '@fontsource/literata/vietnamese-700.css';

import '@fontsource/noto-serif/latin-400.css';
import '@fontsource/noto-serif/vietnamese-400.css';
import '@fontsource/noto-serif/latin-400-italic.css';
import '@fontsource/noto-serif/vietnamese-400-italic.css';
import '@fontsource/noto-serif/latin-700.css';
import '@fontsource/noto-serif/vietnamese-700.css';

import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/vietnamese-400.css';
import '@fontsource/eb-garamond/latin-400-italic.css';
import '@fontsource/eb-garamond/vietnamese-400-italic.css';
import '@fontsource/eb-garamond/latin-700.css';
import '@fontsource/eb-garamond/vietnamese-700.css';

import '@fontsource/be-vietnam-pro/latin-400-italic.css';
import '@fontsource/be-vietnam-pro/vietnamese-400-italic.css';

export const FACES = [
  {
    id: 'literata',
    label: 'Literata',
    family: 'Literata',
    hint: 'serif, thiết kế cho màn đọc',
    stack: "'Literata', 'Noto Serif', Georgia, serif",
  },
  {
    id: 'noto-serif',
    label: 'Noto Serif',
    family: 'Noto Serif',
    hint: 'serif, chữ mở rộng',
    stack: "'Noto Serif', 'Literata', Georgia, serif",
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    family: 'EB Garamond',
    hint: 'serif cổ điển, chữ nhỏ gọn',
    stack: "'EB Garamond', 'Literata', Georgia, serif",
  },
  {
    id: 'be-vietnam-pro',
    label: 'Be Vietnam Pro',
    family: 'Be Vietnam Pro',
    hint: 'sans, dấu tiếng Việt rõ',
    stack: "'Be Vietnam Pro', system-ui, sans-serif",
  },
];

export const DEFAULT_FACE = FACES[0];

export function faceById(id) {
  return FACES.find((f) => f.id === id) ?? DEFAULT_FACE;
}

/* Subset tiếng Việt là một file woff2 riêng, chỉ tải khi thật sự dùng tới. Gọi load() với
   mẫu chữ có dấu để trình duyệt lấy cả hai subset trước khi đo lại vị trí đọc. */
const SAMPLE = 'aăâđêôơưạảãáạ 0123456789 Công nghệ chế biến sữa';

export function preloadFace(id) {
  if (!document.fonts) return Promise.resolve();
  const { family } = faceById(id);
  const specs = [`400 1em "${family}"`, `700 1em "${family}"`, `italic 400 1em "${family}"`];
  return Promise.all(specs.map((spec) => document.fonts.load(spec, SAMPLE))).then(
    () => {},
    () => {},
  );
}
