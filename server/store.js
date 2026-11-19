import fs from 'fs';
import path from 'path';

/* Tiny key/value store for site content and enquiries.
   - On a normal server (or locally): JSON files in DATA_DIR.
   - On Vercel (serverless, no persistent disk): Upstash Redis over its REST API.
     Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN). */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
export const usingRedis = Boolean(REDIS_URL && REDIS_TOKEN);

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
