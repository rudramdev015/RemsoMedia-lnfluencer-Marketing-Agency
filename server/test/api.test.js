import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5077, BASE = `http://localhost:${PORT}`, PASS = 'test-pass-123';
let proc, dir;

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'remso-test-'));
  proc = spawn(process.execPath, [path.join(here, '..', 'index.js')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: dir, ADMIN_PASSWORD: PASS }, stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { try { await fetch(BASE + '/api/content'); return; } catch { await new Promise((r) => setTimeout(r, 150)); } }
  throw new Error('server did not start');
});
after(() => { proc?.kill(); try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } });

const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const login = async () => (await (await fetch(BASE + '/api/login', post({ password: PASS }))).json()).token;
const auth = (t) => ({ Authorization: 'Bearer ' + t });

test('serves site content with the correct phone number', async () => {
  const c = await (await fetch(BASE + '/api/content')).json();
  assert.equal(c.contact.phone, '+91 93516 41459');
  assert.equal(c.contact.whatsapp, '919351641459');
  assert.ok(c.caseStudies.items.length >= 6);
  assert.equal(c.topCreators.items.length, 16);
});

test('rejects wrong password and unauthenticated admin calls', async () => {
  assert.equal((await fetch(BASE + '/api/login', post({ password: 'nope' }))).status, 401);
  assert.equal((await fetch(BASE + '/api/leads')).status, 401);
  assert.equal((await fetch(BASE + '/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
});

test('lead form validates input', async () => {
  assert.equal((await fetch(BASE + '/api/leads', post({ name: '' }))).status, 400);
  assert.equal((await fetch(BASE + '/api/leads', post({ name: 'A', email: 'bad' }))).status, 400);
});

test('honeypot submissions are silently dropped', async () => {
  await fetch(BASE + '/api/leads', post({ name: 'Bot', phone: '1', website: 'spam.com' }));
  const leads = await (await fetch(BASE + '/api/leads', { headers: auth(await login()) })).json();
  assert.equal(leads.length, 0);
});

test('lead is saved, visible to admin, then deletable', async () => {
  assert.equal((await fetch(BASE + '/api/leads', post({ name: 'Test Brand', phone: '9876543210', message: 'hello' }))).status, 200);
  const token = await login();
  const leads = await (await fetch(BASE + '/api/leads', { headers: auth(token) })).json();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].name, 'Test Brand');
  assert.equal((await fetch(BASE + '/api/leads/' + leads[0].id, { method: 'DELETE', headers: auth(token) })).status, 200);
});

test('admin can edit content and the change is served', async () => {
  const token = await login();
  const c = await (await fetch(BASE + '/api/content')).json();
  c.hero.eyebrow = 'EDITED-BY-TEST';
  const put = await fetch(BASE + '/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(c) });
  assert.equal(put.status, 200);
  assert.equal((await (await fetch(BASE + '/api/content')).json()).hero.eyebrow, 'EDITED-BY-TEST');
});
