import { buildKB } from './kb.js';

const STOP = new Set('a an the is are was were be been am do does did you your yours u ur we our i me my mine can could would will shall should may might to of for in on at by and or it its this that these those with about have has had get got there their any some what which who whom how why when where please pls tell give show let lets us as so if then than also just very really kya hai hain ho se ka ki ke ko mein main aap hum mujhe mera meri mere apka apki apke want need like know okay ok hello'.split(' '));
// note: "hello" is a stop word only inside longer sentences — greetings are handled below
const SYN = {
  cost: 'price', pricing: 'price', prices: 'price', charge: 'price', charges: 'price', rate: 'price', rates: 'price', fee: 'price', fees: 'price', quotation: 'quote', kitna: 'price', paisa: 'price', paise: 'price', rupees: 'price', rs: 'price', inr: 'price', package: 'price', packages: 'price', affordable: 'price', cheap: 'price', expensive: 'price',
  influencers: 'creator', influencer: 'creator', creators: 'creator', creator: 'creator', blogger: 'creator', bloggers: 'creator', youtuber: 'creator', youtubers: 'creator', instagrammer: 'creator', kol: 'creator', talent: 'creator', celebs: 'celebrity', celeb: 'celebrity', celebrities: 'celebrity',
  insta: 'instagram', ig: 'instagram', yt: 'youtube', fb: 'facebook', wa: 'whatsapp', x: 'twitter', tweet: 'twitter',
  phone: 'contact', mobile: 'contact', number: 'contact', dial: 'contact', call: 'contact', calls: 'contact',
  mail: 'email', emails: 'email', gmail: 'email',
  hi: 'hello', hii: 'hello', hiii: 'hello', hey: 'hello', hola: 'hello', namaste: 'hello', yo: 'hello',
  thx: 'thanks', thank: 'thanks', shukriya: 'thanks', dhanyavad: 'thanks', ty: 'thanks',
  bye: 'bye', goodbye: 'bye', cya: 'bye',
  students: 'student', admissions: 'admission', admission: 'admission', enrollment: 'admission', enrolment: 'admission', enrol: 'admission',
  moms: 'mom', mother: 'mom', mothers: 'mom', parents: 'mom', parent: 'mom', kids: 'baby', kid: 'baby', children: 'baby', child: 'baby',
  bengaluru: 'bangalore', bombay: 'mumbai', calcutta: 'kolkata', madras: 'chennai', gurugram: 'gurgaon', orissa: 'odisha', uttaranchal: 'uttarakhand', pondicherry: 'puducherry',
  ads: 'ad', advertising: 'ad', advertisement: 'ad', campaigns: 'campaign', brands: 'brand', clients: 'client', videos: 'video', reels: 'reel', shorts: 'short', views: 'view', followers: 'follower', sales: 'sale', leads: 'lead', jobs: 'job', careers: 'career', hire: 'hiring', hiring: 'hiring', timings: 'timing', hours: 'timing', report: 'report', reports: 'report', reporting: 'report'
};
const norm = (s) =>
  String(s).toLowerCase().replace(/how much/g, 'price').replace(/\bpan[- ]india\b/g, 'panindia').replace(/\bnorth[- ]?east\b/g, 'northeast').replace(/\bmaharastra\b/g, 'maharashtra').replace(/[^a-z0-9\s]/g, ' ');
const stem = (w) => {
  if (SYN[w]) return SYN[w];
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};
export const tokens = (s) => {
  const raw = norm(s).split(/\s+/).filter(Boolean);
  const keepAll = raw.length <= 2; // short greetings like "hi there"
  const out = [];
  raw.forEach((w) => { const t = stem(w); if (keepAll || !STOP.has(w)) out.push(t); });
  return out.length ? out : raw.map(stem);
};

let KB, DF, N, TOKS;
function init() {
  if (KB) return;
  KB = buildKB();
  DF = new Map(); N = 0; TOKS = [];
  KB.forEach((intent, ii) => intent.q.forEach((q) => {
    const t = [...new Set(tokens(q))];
    TOKS.push({ ii, t });
    N++;
    t.forEach((w) => DF.set(w, (DF.get(w) || 0) + 1));
  }));
}
const idf = (w) => Math.log(1 + N / (DF.get(w) || 0.5));

export function getKB() { init(); return KB; }

/* returns { intent, score } */
export function match(text) {
  init();
  const q = [...new Set(tokens(text))];
  if (!q.length) return { intent: null, score: 0 };
  const wq = q.reduce((a, w) => a + idf(w) ** 2, 0);
  let best = { ii: -1, score: 0 };
  const second = new Map();
  for (const { ii, t } of TOKS) {
    let shared = 0, wv = 0;
    for (const w of t) { const x = idf(w) ** 2; wv += x; if (q.includes(w)) shared += x; }
    if (!shared) continue;
    let score = shared / Math.sqrt(wq * wv);
    // reward when everything the user said is covered
    if (shared >= wq * 0.999) score += 0.08;
    if (score > (second.get(ii) || 0)) second.set(ii, score);
    if (score > best.score) best = { ii, score };
  }
  return { intent: best.ii >= 0 ? KB[best.ii] : null, score: best.score, ranked: [...second.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([i, s]) => ({ intent: KB[i], score: s })) };
}

export const THRESHOLD = 0.42;
