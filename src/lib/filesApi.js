/* Client cho Worker th-sua-files (Cloudflare R2).
   Dev: chạy `wrangler dev` trong workers/th-sua-files rồi đặt VITE_THSUA_API=http://localhost:8787. */
const API = import.meta.env.VITE_THSUA_API || 'https://th-sua-files.aczaao12.workers.dev';

export function fileUrl(path) {
  return `${API}/f/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function gui(path, init) {
  const res = await fetch(API + path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi API file (${res.status}).`);
  return data;
}

export function uploadFile(file, path) {
  const form = new FormData();
  form.append('path', path);
  form.append('file', file);
  return gui('/upload', { method: 'POST', body: form });
}

export function moveFile(from, to) {
  return gui('/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to }),
  });
}
