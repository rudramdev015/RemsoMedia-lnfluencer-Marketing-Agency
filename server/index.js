import express from 'express';
import cors from 'cors';
import compression from 'compression';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import defaultContent from './defaultContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'uploads') : path.join(__dirname, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'remso@2026';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('remso:' + ADMIN_PASSWORD).digest('hex');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const readJSON = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const writeJSON = (file, data) => {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
};
if (!fs.existsSync(CONTENT_FILE)) writeJSON(CONTENT_FILE, defaultContent);
if (!fs.existsSync(LEADS_FILE)) writeJSON(LEADS_FILE, []);

// ---- auth: stateless signed token ----
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
const makeToken = () => {
  const exp = String(Date.now() + 1000 * 60 * 60 * 12);
  return `${exp}.${sign(exp)}`;
};
const validToken = (t = '') => {
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
};
const auth = (req, res, next) =>
  validToken((req.headers.authorization || '').replace('Bearer ', '')) ? next() : res.status(401).json({ error: 'Unauthorized' });

// simple in-memory rate limiter
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

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(3).toString('hex') + path.extname(file.originalname).toLowerCase())
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /\.(jpe?g|png|webp|gif|svg)$/i.test(file.originalname))
});

// fill in any keys that newer versions of the site added, without touching edited values
const fill = (def, cur) => {
  if (cur === undefined) return def;
  if (def && cur && typeof def === 'object' && typeof cur === 'object' && !Array.isArray(def) && !Array.isArray(cur)) {
    const out = { ...cur };
    for (const k of Object.keys(def)) out[k] = fill(def[k], cur[k]);
    return out;
  }
  return cur;
};
app.get('/api/content', (_req, res) => res.json(fill(defaultContent, readJSON(CONTENT_FILE, defaultContent))));

app.post('/api/login', limit(10, 15 * 60 * 1000), (req, res) => {
  const given = Buffer.from(String(req.body?.password || ''));
  const real = Buffer.from(ADMIN_PASSWORD);
  const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
  ok ? res.json({ token: makeToken() }) : res.status(401).json({ error: 'Wrong password' });
});

app.put('/api/content', auth, (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Invalid content' });
  writeJSON(CONTENT_FILE, req.body);
  res.json({ ok: true });
});

app.post('/api/content/reset', auth, (_req, res) => {
  writeJSON(CONTENT_FILE, defaultContent);
  res.json(defaultContent);
});

app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload an image (jpg, png, webp, gif, svg).' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ---- leads ----
const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
app.post('/api/leads', limit(5, 10 * 60 * 1000), (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clean(b.name, 100),
    brand: clean(b.brand, 120),
    email: clean(b.email, 160),
    phone: clean(b.phone, 30),
    budget: clean(b.budget, 60),
    message: clean(b.message, 2000)
  };
  if (!lead.name || !(lead.email || lead.phone)) return res.status(400).json({ error: 'Please enter your name and an email or phone number.' });
  if (lead.email && !/^\S+@\S+\.\S+$/.test(lead.email)) return res.status(400).json({ error: 'Please enter a valid email.' });
  const leads = readJSON(LEADS_FILE, []);
  leads.unshift(lead);
  writeJSON(LEADS_FILE, leads);
  res.json({ ok: true });
});
app.get('/api/leads', auth, (_req, res) => res.json(readJSON(LEADS_FILE, [])));
app.delete('/api/leads/:id', auth, (req, res) => {
  writeJSON(LEADS_FILE, readJSON(LEADS_FILE, []).filter((l) => l.id !== req.params.id));
  res.json({ ok: true });
});

// ---- serve built React app ----
if (fs.existsSync(CLIENT_DIST)) {
  app.use('/assets', express.static(path.join(CLIENT_DIST, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(CLIENT_DIST, { maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Remso Media server running on http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) console.log('⚠  Using default admin password. Set ADMIN_PASSWORD env var before going live.');
});
