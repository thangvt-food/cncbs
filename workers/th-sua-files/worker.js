/* API file cho form nộp bài TH Sữa: mọi object nằm trong prefix th-sua/ của bucket R2.
   /upload  POST multipart {path, file}   — nộp file (≤20MB)
   /move    POST json {from, to}         — backup/đổi tên: chuyển object, không tải về máy
   /f/*     GET                          — stream file về trình duyệt (Tải / Mở)
   Không phân quyền theo yêu cầu nhóm; chỉ chặn path ngoài th-sua/ và file quá 20MB. */

const MAX = 20 * 1024 * 1024;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

function safePath(p) {
  if (typeof p !== 'string' || p.length > 400) return null;
  const parts = p.split('/');
  if (parts[0] !== 'th-sua' || parts.length < 2) return null;
  if (parts.some((s) => !s || s === '.' || s === '..')) return null;
  return parts.join('/');
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const route = new URL(req.url).pathname;

    if (req.method === 'POST' && route === '/upload') {
      const form = await req.formData().catch(() => null);
      if (!form) return json({ error: 'Body phải là multipart form.' }, 400);
      const path = safePath(form.get('path'));
      const file = form.get('file');
      if (!path) return json({ error: 'Đường dẫn phải nằm trong th-sua/ và không có dấu "..".' }, 400);
      if (!(file instanceof File)) return json({ error: 'Thiếu file.' }, 400);
      if (file.size > MAX) return json({ error: 'File vượt 20MB.' }, 413);
      await env.FILES.put(path, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });
      return json({ path, size: file.size });
    }

    if (req.method === 'POST' && route === '/move') {
      const body = await req.json().catch(() => null);
      const from = safePath(body?.from);
      const to = safePath(body?.to);
      if (!from || !to) return json({ error: 'Đường dẫn không hợp lệ.' }, 400);
      const obj = await env.FILES.get(from);
      if (!obj) return json({ error: 'File không tồn tại.' }, 404);
      await env.FILES.put(to, obj.body, { httpMetadata: obj.httpMetadata });
      await env.FILES.delete(from);
      return json({ to, size: obj.size });
    }

    if (req.method === 'GET' && route.startsWith('/f/')) {
      const path = safePath(decodeURIComponent(route.slice(3)));
      if (!path) return json({ error: 'Đường dẫn không hợp lệ.' }, 400);
      const obj = await env.FILES.get(path);
      if (!obj) return json({ error: 'File không tồn tại.' }, 404);
      const headers = new Headers(CORS);
      obj.writeHttpMetadata(headers);
      headers.set('etag', obj.etag);
      headers.set(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(path.split('/').pop())}`,
      );
      return new Response(obj.body, { headers });
    }

    return json({ error: 'Không có route này.' }, 404);
  },
};
