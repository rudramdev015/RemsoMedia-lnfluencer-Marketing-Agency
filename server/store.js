import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { put, head } from '@vercel/blob';

/* Tiny key/value store for site content and enquiries.
   - On a normal server (or locally): JSON files in DATA_DIR.
   - On Vercel (serverless, no persistent disk): Upstash Redis over its REST API.
     Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN). */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const usingRedis = Boolean(REDIS_URL && REDIS_TOKEN);
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
export const usingBlob = Boolean(BLOB_TOKEN) && !usingRedis;

async function redis(command) {
  const r = await fetch(REDIS_URL, { method: 'POST', headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Redis error ${r.status}`);
  return j.result;
}

export function createStore(dataDir) {
  if (usingRedis) {
    const key = (k) => `remso:${k}`;
    return {
      kind: 'redis',
      async get(k, fallback) {
        const v = await redis(['GET', key(k)]);
        if (v == null) return fallback;
        try { return JSON.parse(v); } catch { return fallback; }
      },
      async set(k, value) { await redis(['SET', key(k), JSON.stringify(value)]); }
    };
  }
  if (usingBlob) {
    // Vercel Blob. Pathnames carry a secret-derived suffix so the (public) URLs cannot be guessed.
    const name = (k) => `remso/${k}-${crypto.createHmac('sha256', BLOB_TOKEN).update(k).digest('hex').slice(0, 32)}.json`;
    return {
      kind: 'blob',
      async get(k, fallback) {
        try {
          const meta = await head(name(k), { token: BLOB_TOKEN });
          const r = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
          return r.ok ? await r.json() : fallback;
        } catch { return fallback; }
      },
      async set(k, value) {
        await put(name(k), JSON.stringify(value), { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, token: BLOB_TOKEN });
      }
    };
  }
  const file = (k) => path.join(dataDir, `${k}.json`);
  return {
    kind: 'file',
    async get(k, fallback) {
      try { return JSON.parse(await fs.promises.readFile(file(k), 'utf8')); } catch { return fallback; }
    },
    async set(k, value) {
      await fs.promises.mkdir(dataDir, { recursive: true });
      const tmp = file(k) + '.tmp';
      await fs.promises.writeFile(tmp, JSON.stringify(value, null, 2));
      await fs.promises.rename(tmp, file(k));
    }
  };
}

/* Upload a binary file (an image) to Vercel Blob and return its public URL. */
export async function putFile(pathname, buffer, contentType) {
  const r = await put(pathname, buffer, { access: 'public', contentType, addRandomSuffix: false, token: BLOB_TOKEN });
  return r.url;
}
