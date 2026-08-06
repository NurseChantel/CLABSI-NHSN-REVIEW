import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root = new URL("../", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".pdf": "application/pdf" };
createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = join(root, normalize(path === "/" ? "/index.html" : path));
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch { response.writeHead(404); response.end("not found"); }
}).listen(8777, () => console.log("serving on http://localhost:8777"));
