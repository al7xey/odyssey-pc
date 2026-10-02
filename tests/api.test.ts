import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { defaultSelection, totalPrice } from '../src/entities/catalog';
let server: Server, url: string, directory: string;
before(async () => {
  process.env.NODE_ENV = 'test';
  directory = await mkdtemp(join(tmpdir(), 'odyssey-api-test-'));
  process.env.QUOTES_DIR = directory;
  const { handler } = await import('../server/index.ts');
  server = createServer((req, res) => {
    void handler(req, res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/quotes`;
});
after(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  if (dirname(resolve(directory)) === resolve(tmpdir()) && directory.includes('odyssey-api-test-'))
    await rm(directory, { recursive: true, force: true });
});
const request = (extra = {}) => ({
  customer: { name: 'Test customer', contact: 'test@example.invalid' },
  consent: true,
  selection: defaultSelection,
  total: 1,
  ...extra,
});
test('Saves quote and calculates price on server, ignoring client price', async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request()),
  });
  assert.equal(response.status, 201);
  const result = (await response.json()) as { id: string };
  assert.match(result.id, /^[a-f0-9-]{36}$/);
  const saved = JSON.parse(await readFile(join(directory, `${result.id}.json`), 'utf8'));
  assert.equal(saved.total, totalPrice(defaultSelection));
  assert.equal(saved.customer.name, 'Test customer');
});
test('Rejects missing consent, unknown parts and incompatible configurations', async () => {
  for (const [payload, status] of [
    [request({ consent: false }), 400],
    [request({ selection: { ...defaultSelection, gpu: 'bad' } }), 400],
    [request({ selection: { ...defaultSelection, case: 'compact' } }), 422],
  ] as const) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, status);
  }
  assert.equal((await readdir(directory)).length, 1);
});
test('Rejects cross-origin requests and excessive bodies', async () => {
  const cross = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://example.invalid',
    },
    body: JSON.stringify(request()),
  });
  assert.equal(cross.status, 403);
  const oversized = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request({ extra: 'a'.repeat(35000) })),
  });
  assert.equal(oversized.status, 413);
});
