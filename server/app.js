import express from 'express';
import cors from 'cors';
import compression from 'compression';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import defaultContent from './defaultContent.js';
import { createStore, usingRedis } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ON_VERCEL = Boolean(process.env.VERCEL);
const PROD = ON_VERCEL || process.env.NODE_ENV === 'production';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : ON_VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'uploads');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

// In production there is NO default password: admin stays disabled until ADMIN_PASSWORD is set.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (PROD ? '' : 'remso@2026');
const SECRET = process.env.SESSION_SECRET || (ADMIN_PASSWORD ? crypto.createHash('sha256').update('remso:' + ADMIN_PASSWORD).digest('hex') : crypto.randomBytes(32).toString('hex'));
const CAN_UPLOAD = !ON_VERCEL || Boolean(process.env.DATA_DIR);

const store = createStore(DATA_DIR);

// ---- auth: stateless signed token (works across serverless instances) ----
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
const makeToken = () => { const exp = String(Date.now() + 1000 * 60 * 60 * 12); return `${exp}.${sign(exp)}`; };
const validToken = (t = '') => {
  const [exp, sig] = t.split('.');
  if (!ADMIN_PASSWORD || !exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
};
const auth = (req, res, next) => (validToken((req.headers.authorization || '').replace('Bearer ', '')) ? next() : res.status(401).json({ error: 'Unauthorized' }));

// simple in-memory rate limiter (per instance)
const hits = new Map();
const limit = (max, windowMs) => (req, res, next) => {
  const key = req.ip + req.path;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) return res.status(429).json({ error: 'Too many requests. Try again later.' });
  list.push(now);
  hits.set(key, list);
  next();
};
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// fill in keys that newer versions of the site added, without touching edited values
const fill = (def, cur) => {
  if (cur === undefined) return def;
  if (def && cur && typeof def === 'object' && typeof cur === 'object' && !Array.isArray(def) && !Array.isArray(cur)) {
    const out = { ...cur };
    for (const k of Object.keys(def)) out[k] = fill(def[k], cur[k]);
    return out;
  }
  return cur;
};
const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

const app = express();
app.set('trust proxy', 1);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

let upload = null;
if (CAN_UPLOAD) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
  upload = multer({
    storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(3).toString('hex') + path.extname(file.originalname).toLowerCase()) }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, /\.(jpe?g|png|webp|gif|svg)$/i.test(file.originalname))
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: store.kind, admin: Boolean(ADMIN_PASSWORD), uploads: CAN_UPLOAD }));

app.get('/api/content', wrap(async (_req, res) => res.json(fill(defaultContent, await store.get('content', defaultContent)))));

// Password: a password changed from the admin panel is stored (scrypt-hashed) in the store and wins over the env var.
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
async function passwordOk(given) {
  const rec = await store.get('admin', null);
  if (rec?.salt && rec?.hash) {
    const a = Buffer.from(hashPw(given, rec.salt)), b = Buffer.from(rec.hash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const g = Buffer.from(String(given)), r = Buffer.from(ADMIN_PASSWORD);
  return g.length === r.length && crypto.timingSafeEqual(g, r);
}

app.post('/api/login', limit(10, 15 * 60 * 1000), wrap(async (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Admin is disabled. Set the ADMIN_PASSWORD environment variable on the server.' });
  (await passwordOk(req.body?.password || '')) ? res.json({ token: makeToken() }) : res.status(401).json({ error: 'Wrong password' });
}));

app.post('/api/password', auth, limit(10, 15 * 60 * 1000), wrap(async (req, res) => {
  const { current = '', next = '' } = req.body || {};
  if (!(await passwordOk(current))) return res.status(403).json({ error: 'Current password is wrong' });
  if (String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  if (store.kind === 'file' && ON_VERCEL) return res.status(503).json({ error: 'Storage is not connected, so the password cannot be saved' });
  const salt = crypto.randomBytes(16).toString('hex');
  await store.set('admin', { salt, hash: hashPw(next, salt) });
  res.json({ ok: true });
}));

app.put('/api/content', auth, wrap(async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Invalid content' });
  await store.set('content', req.body);
  res.json({ ok: true });
}));

app.post('/api/content/reset', auth, wrap(async (_req, res) => { await store.set('content', defaultContent); res.json(defaultContent); }));

app.post('/api/upload', auth, (req, res, next) => {
  if (!upload) return res.status(501).json({ error: 'Image upload needs file storage, which this host does not have. Paste a public image URL instead.' });
  upload.single('file')(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ error: 'Please upload an image (jpg, png, webp, gif, svg).' });
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

app.post('/api/leads', limit(5, 10 * 60 * 1000), wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), name: clean(b.name, 100), brand: clean(b.brand, 120), email: clean(b.email, 160), phone: clean(b.phone, 30), budget: clean(b.budget, 60), message: clean(b.message, 2000) };
  if (!lead.name || !(lead.email || lead.phone)) return res.status(400).json({ error: 'Please enter your name and an email or phone number.' });
  if (lead.email && !/^\S+@\S+\.\S+$/.test(lead.email)) return res.status(400).json({ error: 'Please enter a valid email.' });
  const leads = await store.get('leads', []);
  leads.unshift(lead);
  await store.set('leads', leads.slice(0, 2000));
  res.json({ ok: true });
}));
app.get('/api/leads', auth, wrap(async (_req, res) => res.json(await store.get('leads', []))));
app.delete('/api/leads/:id', auth, wrap(async (req, res) => {
  await store.set('leads', (await store.get('leads', [])).filter((l) => l.id !== req.params.id));
  res.json({ ok: true });
}));

// serve the built React app when running as a normal Node server
if (!ON_VERCEL && fs.existsSync(CLIENT_DIST)) {
  app.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(CLIENT_DIST, { maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

export const info = { ADMIN_PASSWORD_SET: Boolean(process.env.ADMIN_PASSWORD), usingRedis, ON_VERCEL };
export default app;
