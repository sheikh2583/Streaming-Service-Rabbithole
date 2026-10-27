import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.mp4':'video/mp4'};
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {res.writeHead(405, {Allow:'GET, HEAD'});res.end();return;}
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) {res.writeHead(403);res.end('Forbidden');return;}
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const data = req.method === 'HEAD' ? null : await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': file.includes(sep + 'assets' + sep) ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
    });
    res.end(data);
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Openwave production server: http://127.0.0.1:${port}`));
