/* API file cho form nộp bài TH Sữa: mọi object nằm trong prefix th-sua/ của bucket R2.
   /upload  POST multipart {path, file}   — nộp file (≤20MB)
   /move    POST json {from, to}         — backup/đổi tên: chuyển object, không tải về máy
   /f/*     GET                          — stream file về trình duyệt (Tải / Mở)
   Chỉ chấp nhận các origin tin cậy: cncbs.yangio.id.vn, *.github.io, localhost. */

const MAX = 20 * 1024 * 1024;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const host = u.hostname;
    if (host === 'cncbs.yangio.id.vn') return true;
    if (host.endsWith('.github.io')) return true;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return false;
  } catch {
    return false;
  }
}

function getCorsHeaders(origin) {
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://cncbs.yangio.id.vn';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

const json = (data, status = 200, cors = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

function safePath(p) {
  if (typeof p !== 'string' || p.length > 400) return null;
  const parts = p.split('/');
  if (parts[0] !== 'th-sua' || parts.length < 2) return null;
  if (parts.some((s) => !s || s === '.' || s === '..')) return null;
  return parts.join('/');
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = getCorsHeaders(origin);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    // Kiểm tra Origin với các thao tác ghi (POST) nếu có gửi Origin hoặc Referer
    if (req.method === 'POST') {
      const referer = req.headers.get('Referer');
      let reqOrigin = origin;
      if (!reqOrigin && referer) {
        try {
          reqOrigin = new URL(referer).origin;
        } catch {}
      }
      if (reqOrigin && !isAllowedOrigin(reqOrigin)) {
        return json({ error: 'Origin không được phép truy cập.' }, 403, cors);
      }
    }

    const route = new URL(req.url).pathname;

    if (req.method === 'POST' && route === '/upload') {
      const form = await req.formData().catch(() => null);
      if (!form) return json({ error: 'Body phải là multipart form.' }, 400, cors);
      const path = safePath(form.get('path'));
      const file = form.get('file');
      if (!path) return json({ error: 'Đường dẫn phải nằm trong th-sua/ và không có dấu "..".' }, 400, cors);
      if (!(file instanceof File)) return json({ error: 'Thiếu file.' }, 400, cors);
      if (file.size > MAX) return json({ error: 'File vượt 20MB.' }, 413, cors);
      await env.FILES.put(path, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });
      return json({ path, size: file.size }, 200, cors);
    }

    if (req.method === 'POST' && route === '/move') {
      const body = await req.json().catch(() => null);
      const from = safePath(body?.from);
      const to = safePath(body?.to);
      if (!from || !to) return json({ error: 'Đường dẫn không hợp lệ.' }, 400, cors);
      const obj = await env.FILES.get(from);
      if (!obj) return json({ error: 'File không tồn tại.' }, 404, cors);
      await env.FILES.put(to, obj.body, { httpMetadata: obj.httpMetadata });
      await env.FILES.delete(from);
      return json({ to, size: obj.size }, 200, cors);
    }

    if (req.method === 'GET' && route.startsWith('/f/')) {
      const path = safePath(decodeURIComponent(route.slice(3)));
      if (!path) return json({ error: 'Đường dẫn không hợp lệ.' }, 400, cors);
      const obj = await env.FILES.get(path);
      if (!obj) return json({ error: 'File không tồn tại.' }, 404, cors);
      const headers = new Headers(cors);
      obj.writeHttpMetadata(headers);
      headers.set('etag', obj.etag);
      headers.set('X-Content-Type-Options', 'nosniff');
      const isPdf = path.toLowerCase().endsWith('.pdf');
      headers.set(
        'Content-Disposition',
        `${isPdf ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(path.split('/').pop())}`,
      );
      return new Response(obj.body, { headers });
    }

    return json({ error: 'Không có route này.' }, 404, cors);
  },
};
