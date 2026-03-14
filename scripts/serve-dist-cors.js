/**
 * 在 8080 端口提供 dist 静态服务，并为所有响应加上 CORS 头，
 * 使 http://127.0.0.1:8000 页面能跨域加载 8080 上的脚本（如变量结构 index.js）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ROOT = path.join(__dirname, '..', 'dist');

const MIME = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function send(res, statusCode, body, contentType) {
  res.writeHead(statusCode, { ...CORS_HEADERS, 'Content-Type': contentType || 'text/plain' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const method = req.method;
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }
  if (method !== 'GET' && method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', 'text/plain');
    return;
  }

  let pathname = url.parse(req.url).pathname || '/';
  pathname = decodeURIComponent(pathname);
  if (pathname.includes('..')) {
    send(res, 403, 'Forbidden', 'text/plain');
    return;
  }
  const filePath = path.join(ROOT, pathname);

  fs.stat(filePath, (err, stat) => {
    if (err) {
      send(res, 404, 'Not Found', 'text/plain');
      return;
    }
    if (stat.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      fs.stat(index, (e, st) => {
        if (e || !st.isFile()) {
          send(res, 404, 'Not Found', 'text/plain');
          return;
        }
        serveFile(res, index, method);
      });
      return;
    }
    serveFile(res, filePath, method);
  });
});

function serveFile(res, filePath, method) {
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => send(res, 500, 'Internal Server Error', 'text/plain'));
  res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': contentType });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  stream.pipe(res);
}

server.listen(PORT, '127.0.0.1', () => {
  console.info(`serve-dist-cors: http://127.0.0.1:${PORT} (CORS enabled)`);
});
