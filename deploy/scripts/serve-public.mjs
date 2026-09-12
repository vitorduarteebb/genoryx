// Servidor estatico minimo para apps/web/public, so para validar o bundle WebGL antes
// de publicar. Nao e infraestrutura: em producao quem serve public/ e o Next.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] ?? "apps/web/public";
const port = Number(process.argv[3] ?? 8099);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".unityweb": "application/octet-stream",
  ".data": "application/octet-stream",
  ".png": "image/png",
};

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  // normalize + prefixo travado: sem isso "/../.." sai do root.
  const target = normalize(join(root, path === "/" ? "/index.html" : path));
  if (!target.startsWith(normalize(root))) {
    response.writeHead(403).end("forbidden");
    return;
  }

  try {
    const info = statSync(target);
    if (info.isDirectory()) {
      response.writeHead(403).end("directory");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[extname(target)] ?? "application/octet-stream",
      "Content-Length": info.size,
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`servindo ${root} em http://127.0.0.1:${port}`));
