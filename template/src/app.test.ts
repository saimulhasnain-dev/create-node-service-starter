import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

async function withServer(fn: (base: string) => Promise<void>) {
  const server = createApp(loadConfig({ NODE_ENV: 'test' })).listen(0);
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

test('GET /health returns ok', () => withServer(async (base) => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ok');
  assert.ok(res.headers.get('x-request-id'));
}));

test('unknown route returns a JSON 404 with request id', () => withServer(async (base) => {
  const res = await fetch(`${base}/nope`);
  const body = await res.json();
  assert.equal(res.status, 404);
  assert.equal(body.error.requestId, res.headers.get('x-request-id'));
}));

test('malformed JSON returns 400, not 500', () => withServer(async (base) => {
  const res = await fetch(`${base}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
}));

test('config reports every invalid variable at once', () => {
  assert.throws(() => loadConfig({ PORT: 'abc', LOG_LEVEL: 'loud' }), (e: Error) => /PORT/.test(e.message) && /LOG_LEVEL/.test(e.message));
});
