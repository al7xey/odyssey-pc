import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  catalog,
  categories,
  validateSelection,
  validateAppearance,
  compatibility,
  totalPrice,
} from '../src/entities/catalog.js';

const root = resolve(process.cwd(), 'dist');
const dataDir = resolve(process.env.QUOTES_DIR || 'data/quotes');
const rate = new Map<string, { count: number; since: number }>();
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};
function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}
async function readBody(req: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
    if (Buffer.byteLength(body) > 32_768) throw new Error('TOO_LARGE');
  }
  return JSON.parse(body);
}
export async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  if (path === '/api/health') return json(res, 200, { status: 'ok' });
  if (path === '/api/quotes') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    // Same-origin only; keep customer details out of logs and responses.
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host)
          return json(res, 403, { error: 'Origin rejected' });
      } catch {
        return json(res, 403, { error: 'Origin rejected' });
      }
    }
    if (!req.headers['content-type']?.startsWith('application/json'))
      return json(res, 415, { error: 'JSON required' });
    const ip = req.socket.remoteAddress || 'unknown',
      now = Date.now();
    const current = rate.get(ip);
    const bucket = current && now - current.since < 60_000 ? current : { count: 0, since: now };
    if (++bucket.count > 10) return json(res, 429, { error: 'Please try again later' });
    rate.set(ip, bucket);
    if (rate.size > 1000)
      for (const [key, value] of rate) if (now - value.since > 60_000) rate.delete(key);
    try {
      const raw = (await readBody(req)) as Record<string, unknown>;
      if (!raw || typeof raw !== 'object') return json(res, 400, { error: 'Invalid request' });
      const customer = raw.customer as
        | {
            name?: unknown;
            contact?: unknown;
            message?: unknown;
          }
        | undefined;
      if (
        typeof customer?.name !== 'string' ||
        !customer.name.trim() ||
        customer.name.length > 100 ||
        typeof customer.contact !== 'string' ||
        customer.contact.trim().length < 5 ||
        customer.contact.length > 150 ||
        raw.consent !== true
      )
        return json(res, 400, { error: 'Name, contact and consent required' });
      if (
        customer.message !== undefined &&
        (typeof customer.message !== 'string' || customer.message.length > 2000)
      )
        return json(res, 400, { error: 'Invalid message' });
      const input = raw.selection as Record<string, unknown> | undefined;
      if (!input || !categories.every((c) => catalog[c.id].some((p) => p.id === input[c.id])))
        return json(res, 400, { error: 'Unknown component' });
      const selection = validateSelection(input),
        issues = compatibility(selection);
      if (issues.length) return json(res, 422, { error: 'Incompatible configuration', issues });
      const id = randomUUID();
      const quote = {
        id,
        receivedAt: new Date().toISOString(),
        customer: {
          name: customer.name.trim(),
          contact: customer.contact.trim(),
          message: typeof customer.message === 'string' ? customer.message.trim() : '',
        },
        consent: true,
        selection,
        appearance: validateAppearance(raw.appearance),
        total: totalPrice(selection),
        currency: 'RUB',
        estimated: true,
      };
      await mkdir(dataDir, { recursive: true });
      await writeFile(resolve(dataDir, `${id}.json`), JSON.stringify(quote, null, 2), {
        flag: 'wx',
        mode: 0o600,
      });
      return json(res, 201, { id });
    } catch (error) {
      if (error instanceof SyntaxError) return json(res, 400, { error: 'Invalid JSON' });
      if (error instanceof Error && error.message === 'TOO_LARGE')
        return json(res, 413, { error: 'Request too large' });
      return json(res, 500, { error: 'Could not save quote' });
    }
  }
  if (path.startsWith('/api/')) return json(res, 404, { error: 'Not found' });
  if (process.env.API_ONLY === 'true') return json(res, 404, { error: 'Not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD')
    return json(res, 405, { error: 'Method not allowed' });
  try {
    const decoded = decodeURIComponent(path);
    let file = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
    if (!file.startsWith(root + sep)) return json(res, 403, { error: 'Forbidden' });
    try {
      if (!(await stat(file)).isFile()) throw new Error('Not a file');
    } catch {
      if (extname(file)) return json(res, 404, { error: 'Not found' });
      file = resolve(root, 'index.html');
    }
    res.setHeader(
      'Cache-Control',
      file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    );
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    if (req.method === 'HEAD') return res.end();
    createReadStream(file)
      .on('error', () => {
        if (!res.headersSent) json(res, 404, { error: 'Not found' });
        else res.destroy();
      })
      .pipe(res);
  } catch {
    json(res, 400, { error: 'Invalid URL' });
  }
}
if (process.env.NODE_ENV !== 'test') {
  const server = createServer((req, res) => {
    void handler(req, res);
  });
  const port = Number(process.env.API_PORT || process.env.PORT) || 8443;
  server.requestTimeout = 20_000;
  server.listen(port, process.env.HOST || '127.0.0.1', () =>
    console.log(`Odyssey ${process.env.API_ONLY ? 'API' : 'PC'}: http://localhost:${port}`),
  );
  for (const signal of ['SIGTERM', 'SIGINT'])
    process.on(signal, () => {
      server.close(() => process.exit(0));
    });
}
