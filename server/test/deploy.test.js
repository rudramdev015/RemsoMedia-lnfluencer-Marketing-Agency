import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, '..', 'index.js');

async function boot(port, env) {
  const dir = mkdtempSync(path.join(tmpdir(), 'remso-dep-'));
  const proc = spawn(process.execPath, [entry], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, ADMIN_PASSWORD: '', NODE_ENV: '', ...env }, stdio: 'ignore' });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 120; i++) { try { await fetch(base + '/api/health'); break; } catch { await new Promise((r) => setTimeout(r, 150)); } }
  return { base, stop: () => { proc.kill(); try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } } };
}
const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('production without ADMIN_PASSWORD keeps admin disabled (no default password)', async () => {
  const s = await boot(5078, { NODE_ENV: 'production' });
  try {
    assert.equal((await (await fetch(s.base + '/api/health')).json()).admin, false);
    assert.equal((await fetch(s.base + '/api/login', post({ password: 'remso@2026' }))).status, 503);
    assert.equal((await fetch(s.base + '/api/login', post({ password: '' }))).status, 503);
    assert.equal((await fetch(s.base + '/api/leads', { headers: { Authorization: 'Bearer 9999999999999.abc' } })).status, 401);
  } finally { s.stop(); }
});

test('production with ADMIN_PASSWORD allows login', async () => {
  const s = await boot(5079, { NODE_ENV: 'production', ADMIN_PASSWORD: 'strong-pass-9' });
  try {
    assert.equal((await fetch(s.base + '/api/login', post({ password: 'remso@2026' }))).status, 401);
    assert.equal((await fetch(s.base + '/api/login', post({ password: 'strong-pass-9' }))).status, 200);
  } finally { s.stop(); }
});

test('stores content and leads in Upstash Redis when configured (fake REST server)', async () => {
  const db = new Map();
  const fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (req.headers.authorization !== 'Bearer tok') { res.writeHead(401); return res.end('{"error":"bad token"}'); }
      const [cmd, key, val] = JSON.parse(body);
      let result = null;
      if (cmd === 'GET') result = db.has(key) ? db.get(key) : null;
      if (cmd === 'SET') { db.set(key, val); result = 'OK'; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result }));
    });
  });
  await new Promise((r) => fake.listen(5080, r));
  const s = await boot(5081, { ADMIN_PASSWORD: 'pw123456', UPSTASH_REDIS_REST_URL: 'http://localhost:5080', UPSTASH_REDIS_REST_TOKEN: 'tok' });
  try {
    assert.equal((await (await fetch(s.base + '/api/health')).json()).storage, 'redis');
    assert.equal((await fetch(s.base + '/api/leads', post({ name: 'Redis Lead', phone: '9999999999' }))).status, 200);
    assert.ok(db.get('remso:leads').includes('Redis Lead'));
    const token = (await (await fetch(s.base + '/api/login', post({ password: 'pw123456' }))).json()).token;
    const c = await (await fetch(s.base + '/api/content')).json();
    c.hero.eyebrow = 'REDIS-EDIT';
    const put = await fetch(s.base + '/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(c) });
    assert.equal(put.status, 200);
    assert.ok(db.get('remso:content').includes('REDIS-EDIT'));
    assert.equal((await (await fetch(s.base + '/api/content')).json()).hero.eyebrow, 'REDIS-EDIT');
  } finally { s.stop(); fake.close(); }
});

test('Vercel entry (api/index.js) exports a working Express handler', async () => {
  process.env.VERCEL = '1'; process.env.ADMIN_PASSWORD = 'x-pass-12345';
  const { default: handler } = await import('../../api/index.js?vercel');
  const srv = http.createServer(handler);
  await new Promise((r) => srv.listen(5082, r));
  try {
    const h = await (await fetch('http://localhost:5082/api/health')).json();
    assert.equal(h.ok, true);
    assert.equal(h.uploads, false); // no disk on Vercel
  } finally { srv.close(); delete process.env.VERCEL; }
});
