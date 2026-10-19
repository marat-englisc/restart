import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const port = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2" };
if (!fs.existsSync(path.join(root, "index.html"))) throw new Error("Сначала выполните npm run build.");
http.createServer((req, res) => {
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch { res.writeHead(400).end(); return; }
  if (base) {
    if (requested !== base && !requested.startsWith(base + "/")) { res.writeHead(404).end(); return; }
    requested = requested.slice(base.length) || "/";
  }
  let file = path.resolve(root, "." + requested);
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(root, "404.html")).pipe(res); return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  if (req.method === "HEAD") res.end(); else fs.createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Local: http://localhost:${port}${base}/`));
