import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ico':  'image/x-icon',
};

const VIDEOS_DIR = path.join(__dirname, 'videos');

//videos
function serveVideoList(res) {
  fs.readdir(VIDEOS_DIR, (err, files) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Could not read videos directory' }));
      return;
    }

    const videos = files
        .filter((f) => /\.(mp4|webm)$/i.test(f))
        .map((f) => ({
          src: `/videos/${f}`,
          author: `@${path.basename(f, path.extname(f)).replace(/[-_]/g, '')}`,
          title: path.basename(f, path.extname(f)).replace(/[-_]/g, ' '),
          likes: Math.floor(Math.random() * 9000) + 1000,
        }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(videos));
  });
}

// Video streaming with Range support
function serveVideo(filePath, req, res) {
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const fileSize = stat.size;
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'video/mp4';
    const rangeHeader = req.headers['range'];

    if (rangeHeader) {
      // Parse "bytes=start-end"
      const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   contentType,
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      // No Range header — stream the whole file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges':  'bytes',
        'Content-Type':   contentType,
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });
}

// Static files

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const status = err.code === 'ENOENT' ? 404 : 500;
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end(status === 404 ? 'Not found' : 'Server error');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// Router

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/api/videos') {
    serveVideoList(res);
    return;
  }

  const filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);

  if (ext === '.mp4' || ext === '.webm') {
    serveVideo(filePath, req, res);
  } else {
    serveStatic(filePath, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
