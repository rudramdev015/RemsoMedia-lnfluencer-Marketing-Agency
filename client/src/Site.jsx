import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
const HeroScene = lazy(() => import('./Three.jsx').then((m) => ({ default: m.HeroScene })));
const NetworkSphere = lazy(() => import('./Three.jsx').then((m) => ({ default: m.NetworkSphere })));
const ViewsScene = lazy(() => import('./Three.jsx').then((m) => ({ default: m.ViewsScene })));
const ConnectScene = lazy(() => import('./Three.jsx').then((m) => ({ default: m.ConnectScene })));
const IndiaMap = lazy(() => import('./IndiaMap.jsx'));
import Avatar from './Avatar.jsx';
import PhoneMock from './PhoneMock.jsx';
import { sortCases, filterCreators, simulate, compact } from './utils.js';
const ChatBot = lazy(() => import('./chatbot/ChatBot.jsx'));

/* ───────── helpers ───────── */
const fade = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } })
};
const Reveal = ({ children, i = 0, className = '', as = 'div' }) => {
  const M = motion[as];
  return (
    <M className={className} variants={fade} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </M>
  );
};

/* mount a heavy child only after the page has loaded and the browser is idle */
const AfterIdle = ({ children, delay = 600 }) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t;
    const go = () => { t = setTimeout(() => ('requestIdleCallback' in window ? window.requestIdleCallback(() => setOn(true), { timeout: 2500 }) : setOn(true)), delay); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('load', go); };
  }, [delay]);
  return on ? children : null;
};

/* mount a heavy child only when it is close to the viewport */
const NearView = ({ children, className = '', margin = '300px' }) => {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [on, margin]);
  return <div ref={ref} className={className}>{on && <Suspense fallback={null}>{children}</Suspense>}</div>;
};

/* word-by-word masked reveal */
const SplitText = ({ text, as = 'h2', className = '', delay = 0 }) => {
  const M = motion[as];
  return (
    <M className={'split ' + className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} aria-label={text}>
      {String(text).split(' ').map((w, i) => (
        <span className="w" key={i} aria-hidden>
          <motion.span variants={{ hidden: { y: '110%', rotate: 6 }, show: { y: 0, rotate: 0, transition: { duration: 0.8, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] } } }}>{w}&nbsp;</motion.span>
        </span>
      ))}
    </M>
  );
};

/* 3D tilt + glare on hover */
const Tilt = ({ children, className = '', max = 10 }) => {
  const ref = useRef(null);
  const rx = useSpring(0, { stiffness: 200, damping: 18 }), ry = useSpring(0, { stiffness: 200, damping: 18 });
  const gx = useMotionValue(50), gy = useMotionValue(50);
  const glare = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,.22), transparent 55%)`);
  const move = (e) => {
    const b = ref.current.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    ry.set((px - 0.5) * max * 2); rx.set(-(py - 0.5) * max * 2); gx.set(px * 100); gy.set(py * 100);
  };
  const leave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div ref={ref} className={'tilt ' + className} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} onPointerMove={move} onPointerLeave={leave}>
      {children}
      <motion.i className="glare" style={{ background: glare }} />
    </motion.div>
  );
};

/* magnetic button */
const Magnetic = ({ children }) => {
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 14 }), y = useSpring(0, { stiffness: 220, damping: 14 });
  return (
    <motion.span ref={ref} style={{ x, y, display: 'inline-block' }}
      onPointerMove={(e) => { const b = ref.current.getBoundingClientRect(); x.set((e.clientX - b.left - b.width / 2) * 0.3); y.set((e.clientY - b.top - b.height / 2) * 0.4); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.span>
  );
};

/* custom cursor (desktop only) */
const Cursor = () => {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 400, damping: 30 }), sy = useSpring(y, { stiffness: 400, damping: 30 });
  const [big, setBig] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setOn(true);
    const mv = (e) => { x.set(e.clientX); y.set(e.clientY); setBig(!!e.target.closest?.('a, button, .tilt, input, select, textarea')); };
    window.addEventListener('pointermove', mv, { passive: true });
    return () => window.removeEventListener('pointermove', mv);
  }, [x, y]);
  if (!on) return null;
  return (
    <>
      <motion.div className={'cur-ring' + (big ? ' big' : '')} style={{ x: sx, y: sy }} />
      <motion.div className="cur-dot" style={{ x, y }} />
    </>
  );
};

/* intro loader: logo, brand name, live percentage, curtain exit */
const Preloader = ({ logo, done, name = 'Remso Media' }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (done) return;
    const c = animate(0, 100, { duration: 1.05, ease: [0.65, 0, 0.35, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [done]);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="preloader" role="status" aria-label="Loading" exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }} initial={{ clipPath: 'inset(0 0 0% 0)' }}>
          <div className="pl-rings"><i /><i /><i /></div>
          <motion.img src={logo} alt="" initial={{ scale: 0.3, rotate: -200, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          <div className="pl-name" aria-hidden>
            {name.split('').map((ch, i) => (
              <motion.span key={i} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.045, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>{ch === ' ' ? '\u00a0' : ch}</motion.span>
            ))}
          </div>
          <motion.small initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>Connecting brands with the right creators</motion.small>
          <div className="pl-count"><b>{String(n).padStart(2, '0')}</b><span>%</span></div>
          <div className="pbar"><i style={{ width: n + '%' }} /></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Counter = ({ value, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, Number(value) || 0, { duration: 2, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref}>{n.toLocaleString('en-IN')}{suffix}</span>;
};

const SectionHead = ({ eyebrow, title, text, center }) => (
  <Reveal className={'section-head' + (center ? ' center' : '')}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <SplitText text={title} />
    {text && <p>{text}</p>}
  </Reveal>
);

const waLink = (c) => `https://wa.me/${String(c.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hi Remso Media, I want to start an influencer campaign.')}`;
const go = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

/* ───────── nav ───────── */
function Nav({ c }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const links = [['what', 'Why it works'], ['creators', 'Creators'], ['cases', 'Case studies'], ['clients', 'Brands'], ['team', 'Team'], ['faq', 'FAQ']];
  return (
    <header className={'nav' + (solid ? ' solid' : '')}>
      <div className="wrap nav-in">
        <a href="#top" className="logo" onClick={go('top')}>
          <img src={c.brand.logo} alt="" />
          <span>{c.brand.name}</span>
        </a>
        <nav className={open ? 'open' : ''}>
          {links.map(([id, label]) => (
            <a key={id} href={'#' + id} onClick={(e) => { go(id)(e); setOpen(false); }}>{label}</a>
          ))}
          <a className="btn btn-gold sm" href="#contact" onClick={(e) => { go('contact')(e); setOpen(false); }}>Let’s talk</a>
        </nav>
        <button className={'burger' + (open ? ' on' : '')} aria-label="Menu" onClick={() => setOpen(!open)}><i /><i /></button>
      </div>
    </header>
  );
}

function Chip({ ch, i, sx, sy }) {
  const x = useTransform(sx, (v) => v * ch.k);
  const y = useTransform(sy, (v) => v * ch.k);
  return (
    <motion.div className={'chip ' + ch.cls} style={{ x, y }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 + i * 0.2, type: 'spring' }}>
      <strong>{ch.t}</strong><small>{ch.s}</small>
    </motion.div>
  );
}

/* ───────── hero ───────── */
function Hero({ c }) {
  const h = c.hero;
  const [small] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setW((x) => (x + 1) % h.rotating.length), 2400);
    return () => clearInterval(t);
  }, [h.rotating.length]);

  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });
  const onMove = (e) => {
    mx.set((e.clientX / window.innerWidth - 0.5) * 2);
    my.set((e.clientY / window.innerHeight - 0.5) * 2);
  };

  const chips = (h.chips || []).map((x, i) => ({ ...x, cls: 'c' + (i + 1), k: [26, -34, 40][i % 3] }));

  return (
    <section id="top" className="hero" onMouseMove={onMove}>
      <div className="aurora a1" /><div className="aurora a2" /><div className="grid-bg" />
      <div className="wrap hero-in">
        <div className="hero-copy">
          <motion.span className="pill" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <b /> {h.eyebrow}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            {h.title}{' '}
            <span className="rot">
              <AnimatePresence mode="wait">
                <motion.em key={w} initial={{ y: '90%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-90%', opacity: 0 }} transition={{ duration: 0.45 }}>
                  {h.rotating[w]}
                </motion.em>
              </AnimatePresence>
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{h.subtitle}</motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
            <Magnetic><a className="btn btn-gold" href="#contact" onClick={go('contact')}>{h.ctaPrimary} <span>→</span></a></Magnetic>
            <Magnetic><a className="btn btn-ghost" href="#work" onClick={go('work')}>{h.ctaSecondary}</a></Magnetic>
          </motion.div>
          {c.about?.image1 && (
            <motion.a href="#contact" onClick={go('contact')} className="hero-face" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <img src={c.about.image1} alt="" /><span><b>{c.about.name || 'Founder'}</b><i>{c.about.role}</i><small>Talk to the founder directly →</small></span>
            </motion.a>
          )}
        </div>

        <div className="hero-art">
          {small
            ? <motion.img className="hero-logo-m" src={c.brand.logo} alt="" width="200" height="200" animate={{ y: [0, -12, 0], rotateY: [0, 18, 0, -18, 0] }} transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }} />
            : <AfterIdle><Suspense fallback={null}><HeroScene logo={c.brand.logo} /></Suspense></AfterIdle>}
          {chips.map((ch, i) => ch.t && <Chip key={i} ch={ch} i={i} sx={sx} sy={sy} />)}
        </div>
      </div>
      <div className="scroll-hint"><i /></div>
    </section>
  );
}

/* ───────── marquee ───────── */
function Marquee({ c }) {
  const items = [...c.brandsStrip, ...c.brandsStrip, ...c.brandsStrip];
  const big = ['Influencer Marketing', 'Creators', 'Reach', 'Sales', 'Conversions', 'Pan-India'];
  return (
    <div className="marquees" aria-label="Brands we work with">
      <div className="marquee">
        <div className="marquee-track">{items.map((b, i) => <span key={i}>{b}<i>✦</i></span>)}</div>
      </div>
      <div className="outline-marq" aria-hidden>
        <div className="marquee-track rev">{[...big, ...big, ...big].map((b, i) => <span key={i}>{b}<i>●</i></span>)}</div>
      </div>
    </div>
  );
}

/* ───────── stats ───────── */
function Stats({ c }) {
  return (
    <section className="stats">
      <NearView className="net-wrap"><NetworkSphere /></NearView>
      <div className="wrap stats-in">
        <Reveal className="stats-copy">
          <span className="eyebrow">Our reach</span>
          <SplitText text="A creator network that covers all of India." />
          <p>Every state. Every language. Every category — connected, briefed and activated from one place.</p>
        </Reveal>
        <div className="stats-grid">
          {c.stats.map((s, i) => (
            <Reveal key={i} i={i} className="stat">
              <b><Counter value={s.value} suffix={s.suffix} /></b>
              <span>{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── creators ───────── */
function Creators({ c }) {
  const d = c.creators;
  const [tab, setTab] = useState('category');
  const [tier, setTier] = useState(1);
  const tabs = [['category', 'By category'], ['region', 'By state / region'], ['tier', 'By influencer size']];
  return (
    <section id="creators" className="sec">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <Reveal className="tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {tab === k && <motion.i layoutId="tabpill" />}
              <span>{l}</span>
            </button>
          ))}
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            {tab === 'category' && (
              <div className="cat-grid">
                {d.categories.map((x, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.045, type: 'spring', stiffness: 200, damping: 18 }}>
                    <Tilt className="cat" max={14}><span className="ico">{x.icon}</span><b>{x.name}</b></Tilt>
                  </motion.div>
                ))}
              </div>
            )}
            {tab === 'region' && (
              <div className="region-grid">
                {d.regions.map((x, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Tilt className="region" max={9}><small>0{i + 1}</small><h3>{x.name}</h3><p>{x.note}</p><span className="pulse" /></Tilt>
                  </motion.div>
                ))}
              </div>
            )}
            {tab === 'tier' && (
              <div className="tiers">
                <div className="tier-bars">
                  {d.tiers.map((x, i) => (
                    <button key={i} className={'tier-bar' + (tier === i ? ' on' : '')} onClick={() => setTier(i)} onMouseEnter={() => setTier(i)}>
                      <motion.i initial={{ height: 0 }} animate={{ height: 36 + i * 34 }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 90 }} />
                      <span>{x.name}</span>
                    </button>
                  ))}
                </div>
                <div className="tier-info">
                  <AnimatePresence mode="wait">
                    <motion.div key={tier} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                      <small>{d.tiers[tier].size}</small>
                      <h3>{d.tiers[tier].name} influencers</h3>
                      <p>{d.tiers[tier].note}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ───────── work ───────── */
function Work({ c }) {
  const d = c.work;
  return (
    <section id="work" className="sec dark">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="work-grid">
          {d.items.map((x, i) => (
            <Reveal key={i} i={i % 3} className={'case' + (i === 1 ? ' feat' : '')}>
              <Tilt className="card3d" max={8}>
                <article>
                  <span className="tag">{x.tag}</span>
                  <div className="metric">{x.metric}</div>
                  <em>{x.metricLabel}</em>
                  <h3>{x.brand}</h3>
                  <p>{x.text}</p>
                  <i className="arrow">↗</i>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── services ───────── */
function Services({ c }) {
  const d = c.services;
  return (
    <section id="services" className="sec">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} />
        <div className="svc-grid">
          {d.items.map((x, i) => (
            <Reveal key={i} i={i % 3}>
              <Tilt className="svc" max={10}>
                <span className="ico">{x.icon}</span>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── process ───────── */
function Process({ c }) {
  const d = c.process;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const h = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <section id="process" className="sec cream2">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} />
        <div className="steps" ref={ref}>
          <div className="rail"><motion.i style={{ height: h }} /></div>
          {d.steps.map((x, i) => (
            <Reveal key={i} className="step">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <div><h3>{x.title}</h3><p>{x.text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── about ───────── */
function About({ c }) {
  const d = c.about;
  const [alt, setAlt] = useState(false);
  const imgs = [d.image1, d.image2].filter(Boolean);
  return (
    <section id="about" className="sec">
      <div className="wrap about">
        <Reveal className="about-photo">
          <div className="frame" onMouseEnter={() => setAlt(true)} onMouseLeave={() => setAlt(false)} onClick={() => setAlt(!alt)}>
            {imgs.map((src, i) => (
              <motion.img key={i} src={src} alt={d.name || d.role} loading="lazy"
                animate={{ opacity: (alt ? 1 : 0) === i || imgs.length === 1 ? 1 : 0, scale: (alt ? 1 : 0) === i ? 1 : 1.06 }} transition={{ duration: 0.6 }} />
            ))}
            <div className="badge"><b>{c.stats[1]?.value}{c.stats[1]?.suffix}</b><span>brands trust us</span></div>
          </div>
          <i className="deco d1" /><i className="deco d2" />
        </Reveal>
        <div>
          <SectionHead eyebrow={d.eyebrow} title={d.title} />
          <Reveal i={1}>
            <p className="lead">{d.text}</p>
            <ul className="ticks">{d.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            <div className="who">{d.name && <b>{d.name}</b>}<span>{d.role}</span></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────── faq ───────── */
function FAQ({ c }) {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="sec cream2">
      <div className="wrap narrow">
        <SectionHead title={c.faq.title} center />
        {c.faq.items.map((x, i) => (
          <Reveal key={i} i={i} className={'faq' + (open === i ? ' on' : '')}>
            <button onClick={() => setOpen(open === i ? -1 : i)}><span>{x.q}</span><i>+</i></button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ans">
                  <p>{x.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── contact ───────── */
function Contact({ c }) {
  const k = c.contact;
  const [f, setF] = useState({ name: '', brand: '', email: '', phone: '', budget: '', message: '', website: '' });
  const [state, setState] = useState({ s: 'idle', msg: '' });
  const set = (n) => (e) => setF({ ...f, [n]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setState({ s: 'loading', msg: '' });
    try {
      let r, j, wa = '';
      try { r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }); j = await r.json(); } catch { r = null; }
      if (r && !r.ok && (r.status === 400 || r.status === 429)) throw new Error(j.error || 'Something went wrong');
      if (!r || !r.ok) {
        // no backend available (static hosting): hand the enquiry over via WhatsApp instead of losing it
        if (!f.name.trim() || !(f.email || f.phone)) throw new Error('Please enter your name and an email or phone number.');
        const text = `Hi Remso Media! I'm ${f.name}${f.brand ? ' from ' + f.brand : ''}.${f.budget ? ' Budget: ' + f.budget + '.' : ''} ${f.message}
Contact: ${f.phone || f.email}`;
        wa = `https://wa.me/${String(k.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      }
      setState({ s: 'done', msg: '', wa });
      setF({ name: '', brand: '', email: '', phone: '', budget: '', message: '', website: '' });
    } catch (err) {
      setState({ s: 'error', msg: err.message });
    }
  };
  const rows = [
    ['📞', 'Call us', k.phone, 'tel:' + k.phone.replace(/[^\d+]/g, '')],
    ['💬', 'WhatsApp', 'Chat instantly', waLink(k)],
    ['✉️', 'Email', k.email, 'mailto:' + k.email],
    ['📍', 'Location', k.address, null]
  ];
  return (
    <section id="contact" className="sec contact">
      <div className="aurora a1" />
      <div className="wrap contact-in">
        <div>
          <Reveal><span className="eyebrow">Contact</span><h2>{c.cta.title}</h2><p className="lead">{c.cta.text}</p></Reveal>
          <div className="c-rows">
            {rows.map(([i, t, v, h], n) => (
              <Reveal key={n} i={n}>
                {h ? <a className="c-row" href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noreferrer"><span>{i}</span><div><small>{t}</small><b>{v}</b></div></a>
                  : <div className="c-row"><span>{i}</span><div><small>{t}</small><b>{v}</b></div></div>}
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal i={2}>
          <form className="form" onSubmit={submit}>
            <AnimatePresence mode="wait">
              {state.s === 'done' ? (
                <motion.div key="ok" className="thanks" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="check">✓</div>
                  <h3>Thank you!</h3>
                  <p>{state.wa ? 'One last step — tap below to send your details to our team on WhatsApp.' : 'We have received your details and will contact you shortly.'}</p>
                  {state.wa && <a className="btn btn-gold" href={state.wa} target="_blank" rel="noreferrer">💬 Send on WhatsApp</a>}
                  <button type="button" className="btn btn-ghost" onClick={() => setState({ s: 'idle', msg: '' })}>Send another</button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="two">
                    <label>Your name *<input value={f.name} onChange={set('name')} required maxLength={100} /></label>
                    <label>Brand / company<input value={f.brand} onChange={set('brand')} maxLength={120} /></label>
                  </div>
                  <div className="two">
                    <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
                    <label>Phone / WhatsApp<input value={f.phone} onChange={set('phone')} maxLength={30} /></label>
                  </div>
                  <label>Campaign budget
                    <select value={f.budget} onChange={set('budget')}>
                      <option value="">Select a range</option>
                      <option>Under ₹50,000</option><option>₹50,000 – ₹2,00,000</option><option>₹2,00,000 – ₹10,00,000</option><option>₹10,00,000+</option>
                    </select>
                  </label>
                  <label>Tell us about your campaign<textarea rows={4} value={f.message} onChange={set('message')} maxLength={2000} /></label>
                  <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden />
                  {state.s === 'error' && <p className="err">{state.msg}</p>}
                  <button className="btn btn-gold wide" disabled={state.s === 'loading'}>{state.s === 'loading' ? 'Sending…' : 'Send enquiry →'}</button>
                  <small className="muted">Fields marked * required. Provide an email or phone so we can reach you.</small>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── footer ───────── */
const IconIg = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.500" cy="6.500" r="1" fill="currentColor" /></svg>;
const IconIn = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.980 3.500a2.500 2.500 0 1 1 0 5 2.500 2.500 0 0 1 0-5zM3 9.500h4V21H3zM9.500 9.500h3.800v1.600h.1c.5-1 1.800-2 3.700-2 4 0 4.700 2.600 4.700 6V21h-4v-5c0-1.300 0-2.800-1.800-2.800s-2.100 1.400-2.100 2.800V21h-4z" /></svg>;
const IconYt = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3z" /></svg>;

function Footer({ c }) {
  const k = c.contact, f = c.footer || {};
  const tel = 'tel:' + k.phone.replace(/[^\d+]/g, '');
  const logos = (c.clients.logos || []).map((l) => l.name);
  const explore = [['what', 'Why influencer marketing'], ['creators', 'Our creators'], ['cases', 'Case studies'], ['clients', 'Brands we serve'], ['services', 'Services'], ['team', 'Team'], ['faq', 'FAQ']];
  const founder = c.about?.image1;
  return (
    <footer className="footer">
      <div className="foot-cta">
        <div className="aurora a1" /><div className="aurora a2" />
        <div className="wrap foot-cta-in">
          <Reveal className="fc-copy">
            <SplitText text={f.ctaTitle || 'Let’s build your next big campaign.'} />
            <p>{f.ctaText}</p>
            <div className="fc-btns">
              <Magnetic><a className="btn btn-gold" href={tel}>📞 {k.phone}</a></Magnetic>
              <Magnetic><a className="btn btn-ghost" href={waLink(k)} target="_blank" rel="noreferrer">💬 WhatsApp us</a></Magnetic>
              {c.profile && <Magnetic><a className="btn btn-ghost" href={c.profile.file} download target="_blank" rel="noreferrer">⬇ Portfolio PDF</a></Magnetic>}
            </div>
          </Reveal>
          {founder && (
            <Reveal i={2} className="fc-face">
              <motion.div className="face-ring" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 24, ease: 'linear' }} />
              <img src={founder} alt={c.about.name || 'Founder'} loading="lazy" />
              <div className="face-tag"><b>{c.about.name || 'Founder'}</b><span>{c.about.role}</span></div>
            </Reveal>
          )}
        </div>
      </div>

      <div className="foot-brands" aria-hidden>
        <div className="marquee-track">{[...logos, ...logos, ...logos].map((b, i) => <span key={i}>{b}<i>✦</i></span>)}</div>
      </div>

      <div className="wrap foot-grid">
        <div className="fcol fbrand">
          <a href="#top" className="logo" onClick={go('top')}><img src={c.brand.logo} alt="" /><span>{c.brand.name}</span></a>
          <p>{f.blurb}</p>
          <div className="soc">
            {[['Instagram', k.instagram, <IconIg />], ['LinkedIn', k.linkedin, <IconIn />], ['YouTube', k.youtube, <IconYt />]].filter(([, u]) => u).map(([n, u, ic]) => <a key={n} href={u} target="_blank" rel="noreferrer" aria-label={n}>{ic}</a>)}
          </div>
        </div>
        <div className="fcol">
          <h3 className="fh">Explore</h3>
          {explore.map(([id, l]) => <a key={id} href={'#' + id} onClick={go(id)}>{l}</a>)}
        </div>
        <div className="fcol">
          <h3 className="fh">What we do</h3>
          {c.services.items.map((s) => <a key={s.title} href="#services" onClick={go('services')}>{s.title}</a>)}
        </div>
        <div className="fcol">
          <h3 className="fh">Contact</h3>
          <a href={tel}>📞 {k.phone}</a>
          <a href={waLink(k)} target="_blank" rel="noreferrer">💬 WhatsApp chat</a>
          <a href={'mailto:' + k.email}>✉️ {k.email}</a>
          {k.mapLink ? <a href={k.mapLink} target="_blank" rel="noreferrer">📍 {k.address}</a> : <span className="addr">📍 {k.address}</span>}
        </div>
      </div>

      <div className="foot-word" aria-hidden>REMSO MEDIA</div>
      <div className="wrap foot-bottom">
        <small>© {new Date().getFullYear()} {c.brand.name}. All rights reserved. Made with ♥ in India.</small>
        <button onClick={go('top')} aria-label="Back to top">Back to top ↑</button>
      </div>
    </footer>
  );
}

/* ───────── connect (3D) ───────── */
function Connect({ c }) {
  const d = c.connect;
  return (
    <section id="connect" className="sec dark connect">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <Reveal className="connect-stage">
          <NearView className="connect-wrap" margin="200px"><ConnectScene /></NearView>
          <span className="clabel l">{d.labels.brands}</span>
          <span className="clabel m">{d.labels.hub}</span>
          <span className="clabel r">{d.labels.creators}</span>
        </Reveal>
        <div className="points">
          {d.points.map((p, i) => <Reveal key={i} i={i} className="point"><b>0{i + 1}</b><span>{p}</span></Reveal>)}
        </div>
      </div>
    </section>
  );
}

/* ───────── creator spotlight ───────── */
function Spotlight({ c }) {
  const d = c.spotlight;
  const items = [...d.items, ...d.items];
  return (
    <section className="sec spot">
      <div className="wrap"><SectionHead eyebrow={d.eyebrow} title={d.title} /></div>
      <div className="spot-row">
        <div className="spot-track">
          {items.map((x, i) => (
            <div className="spot-card" key={i}>
              <div className="spot-av"><Avatar {...x} bg={[['#0b5545', '#04372f'], ['#d9a21b', '#8a5f08'], ['#2e9c86', '#0b5545'], ['#8a2be2', '#3b1370']][i % 4]} /><span className="tier">{x.tier}</span></div>
              <b>{x.name}</b>
              <small>{x.category}</small>
              <em>{x.platform}</em>
            </div>
          ))}
        </div>
      </div>
      <p className="spot-note wrap">{d.note}</p>
    </section>
  );
}

/* ───────── what is influencer marketing ───────── */
function WhatIs({ c }) {
  const d = c.what;
  return (
    <section id="what" className="sec what">
      <div className="wrap">
        <div className="what-hero">
          <div className="wh-grid" aria-hidden />
          <div className="aurora a1" aria-hidden />
          {['✨', '🎬', '❤️', '📈', '🛒', '⭐'].map((e, i) => <span key={i} className={'wh-float f' + (i + 1)} aria-hidden>{e}</span>)}
          <div className="wh-copy">
            <Reveal><span className="eyebrow">{d.eyebrow}</span></Reveal>
            <h2 className="wh-title" aria-label={d.title}>
              <SplitText as="span" text={d.title.split('. ')[0] + '.'} />
              {d.title.includes('. ') && <SplitText as="span" className="gold" delay={0.25} text={d.title.split('. ').slice(1).join('. ')} />}
            </h2>
            <Reveal i={2}><p>{d.text}</p></Reveal>
            <Reveal i={3} className="wh-pills">
              {d.flow.map((f, i) => <span key={i}><b>{i + 1}</b>{f}</span>)}
            </Reveal>
          </div>
          <Reveal i={1} className="wh-orbit-wrap">
            <div className="wh-orbit">
              <div className="wh-ring r1" /><div className="wh-ring r2" />
              <div className="wh-spin">
                {d.flow.map((f, i) => (
                  <div key={i} className="wh-node" style={{ '--a': (i * 360) / d.flow.length + 'deg' }}>
                    <div className="wh-node-in">
                      <span className="wh-ico">{['🏷️', '🎤', '👥', '📈'][i % 4]}</span>
                      <b>{f}</b>
                      <i>{i + 1}</i>
                    </div>
                  </div>
                ))}
                <span className="wh-signal" />
              </div>
              <div className="wh-core">
                <img src={c.brand.logo} alt="" />
                <span>TRUST</span>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal><h3 className="sub-h">{d.benefitsTitle}</h3></Reveal>
        <div className="benefits">
          {d.benefits.map((x, i) => (
            <Reveal key={i} i={i % 3}>
              <Tilt className="benefit" max={8}><span className="ico">{x.icon}</span><h4>{x.title}</h4><p>{x.text}</p></Tilt>
            </Reveal>
          ))}
        </div>

        <Reveal><h3 className="sub-h">{d.compareTitle}</h3></Reveal>
        <Reveal className="compare">
          <div className="cmp-head"><span /><b>Traditional ads</b><b className="win">Influencer marketing ✦</b></div>
          {d.compare.map((r, i) => (
            <div className="cmp-row" key={i}><span>{r.label}</span><p>{r.ads}</p><p className="win">{r.inf}</p></div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── 7 billion views (3D) ───────── */
function Billion({ c }) {
  const d = c.billion;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const [small] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  if (!d) return null;
  return (
    <section id="views" className="sec billion" ref={ref}>
      <div className="aurora a1" /><div className="aurora a2" />
      <div className="bn-stage" aria-hidden>
        <NearView className="bn-3d" margin="200px"><ViewsScene /></NearView>
      </div>
      <div className="wrap bn-in">
        <div className="bn-copy">
          <Reveal><span className="eyebrow">{d.eyebrow}</span></Reveal>
          <motion.div className="bn-num" style={small ? undefined : { y }}>
            <b><Counter value={d.value} suffix={d.suffix} /></b>
            <span>{d.unit}</span>
          </motion.div>
          <SplitText text={d.title} className="bn-title" />
          <Reveal i={2}><p>{d.line}</p></Reveal>
          <Reveal i={3} className="bn-plat">{d.platforms.map((p) => <span key={p}>{p}</span>)}</Reveal>
        </div>
      </div>
      <div className="wrap">
        <div className="bn-hi">
          {d.highlights.map((h, i) => (
            <Reveal key={i} i={i}><Tilt className="bn-card" max={10}><b>{h.v}</b><span>{h.l}</span></Tilt></Reveal>
          ))}
        </div>
        <p className="bn-note">{d.disclaimer}</p>
      </div>
    </section>
  );
}

/* ───────── campaign simulator ───────── */
function Simulator({ c }) {
  const d = c.simulator;
  const [counts, setCounts] = useState(() => (d ? d.tiers.map((t) => t.start || 0) : []));
  const [views, setViews] = useState(0);
  const res = d ? simulate(counts, d.tiers, d.ctr, d.cvr) : { views: 0, clicks: 0, orders: 0, creators: 0 };
  useEffect(() => {
    const ctl = animate(views, res.views, { duration: 0.8, ease: 'easeOut', onUpdate: (v) => setViews(Math.round(v)) });
    return () => ctl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.views]);
  if (!d) return null;
  const peak = Math.max(res.views, 1);
  const bars = [['Views', res.views, 100], ['Clicks', res.clicks, (res.clicks / peak) * 100], ['Orders', res.orders, (res.orders / peak) * 100]];
  const msg = encodeURIComponent(`Hi Remso Media! I tried your simulator with ${res.creators} creators (${d.tiers.map((t, i) => (counts[i] ? counts[i] + ' ' + t.name : null)).filter(Boolean).join(', ') || 'no mix yet'}). Can you plan a real campaign for my brand?`);
  return (
    <section id="simulator" className="sec sim">
      <div className="aurora a2" />
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="sim-grid">
          <Reveal className="sim-controls">
            {d.tiers.map((t, i) => (
              <label key={t.name} className="sim-row">
                <span className="sim-top"><b>{t.name}</b><small>{t.size}</small><em>{counts[i]}</em></span>
                <input type="range" min="0" max={t.max} value={counts[i]} aria-label={`${t.name} creators`} style={{ '--p': (counts[i] / t.max) * 100 + '%' }}
                  onChange={(e) => setCounts(counts.map((x, n) => (n === i ? Number(e.target.value) : x)))} />
              </label>
            ))}
            <button className="sim-reset" onClick={() => setCounts(d.tiers.map(() => 0))}>Reset</button>
          </Reveal>
          <Reveal i={1} className="sim-out">
            <div className="sim-big"><small>Estimated views</small><b>{compact(views)}</b><span>from {res.creators} creator{res.creators === 1 ? '' : 's'}</span></div>
            <div className="sim-bars">
              {bars.map(([l, v, w]) => (
                <div key={l} className="sim-bar"><span>{l}</span><div><motion.i animate={{ width: Math.max(w, v ? 3 : 0) + '%' }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} /></div><b>{compact(v)}</b></div>
              ))}
            </div>
            <p className="sim-note">{d.disclaimer}</p>
            <a className="btn btn-gold" href={`https://wa.me/${String(c.contact.whatsapp).replace(/\D/g, '')}?text=${msg}`} target="_blank" rel="noreferrer">Plan this for my brand <span>→</span></a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────── case studies (filter + sort) ───────── */
const CS_FILTERS = [['all', 'All'], ['awareness', 'Awareness'], ['conversion', 'Sales & conversion'], ['admissions', 'Admissions'], ['always-on', 'Always-on']];
const CS_AV = [
  { skin: '#d9a07a', hair: '#15110f', top: '#2b6cb0', style: 'short', extras: 'glasses' }, { skin: '#e8b48c', hair: '#1b1210', top: '#d9467a', style: 'long', extras: 'bindi' },
  { skin: '#c98d64', hair: '#0f0c0b', top: '#e08a1e', style: 'cap', extras: 'beard' }, { skin: '#ecc19c', hair: '#2a1a14', top: '#2e9c86', style: 'bun', extras: '' },
  { skin: '#d4996f', hair: '#17110e', top: '#1f3b4d', style: 'short', extras: 'beard' }, { skin: '#e0ab83', hair: '#33201a', top: '#8a2be2', style: 'curly', extras: '' }
];
function CaseStudies({ c }) {
  const d = c.caseStudies;
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('featured');
  const [brand, setBrand] = useState(d.items[0].brand);
  const list = sortCases(d.items.filter((x) => filter === 'all' || x.type === filter), sort);
  const x = list.find((y) => y.brand === brand) || list[0];
  const idx = d.items.findIndex((y) => y.brand === x?.brand);
  return (
    <section id="cases" className="sec cases">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <Reveal className="cs-controls">
          <div className="cs-filters" role="group" aria-label="Filter case studies">
            {CS_FILTERS.map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => { setFilter(k); }}>{l}<small>{k === 'all' ? d.items.length : d.items.filter((y) => y.type === k).length}</small></button>)}
          </div>
          <label className="cs-sort">Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option><option value="impact">Biggest numbers</option><option value="az">A – Z</option>
            </select>
          </label>
        </Reveal>
        {x ? (
          <>
            <div className="cs-tabs" role="tablist">
              {list.map((it) => (
                <button key={it.brand} role="tab" aria-selected={x.brand === it.brand} className={x.brand === it.brand ? 'on' : ''} onClick={() => setBrand(it.brand)}>
                  {x.brand === it.brand && <motion.i layoutId="cstab" />}<span>{it.brand}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={x.brand} className="cs" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4 }}>
                <div className="cs-hero">
                  <span className="tag">{x.industry}</span>
                  <div className="cs-metric">{x.metric ? <Counter value={x.metric} suffix={x.suffix} /> : <span className="word">{x.brand}</span>}</div>
                  <em>{x.metricLabel}</em>
                  <h3>{x.brand}</h3>
                  <div className="cs-tags">{x.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  <div className="cs-phone"><PhoneMock {...CS_AV[(idx < 0 ? 0 : idx) % CS_AV.length]} stat={x.results[0]?.v} label={x.brand} /></div>
                </div>
                <div className="cs-body">
                  {[['🎯', 'Objective', x.goal], ['⚡', 'Challenge', x.challenge], ['🧭', 'Our approach', x.approach], ['🗓️', 'Period', x.period]].map(([ic, t, tx], n) => (
                    <motion.div key={t} className="cs-block" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + n * 0.08 }}>
                      <span>{ic}</span><div><small>{t}</small><p>{tx}</p></div>
                    </motion.div>
                  ))}
                  <div className="cs-results">
                    {x.results.map((r, n) => (
                      <motion.div key={n} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + n * 0.1, type: 'spring' }}>
                        <b>{r.v}</b><span>{r.l}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="cs-note">{[x.note, d.disclaimer].filter(Boolean).join(' · ')}</p>
                  <a className="btn btn-gold" href="#contact" onClick={go('contact')}>Get results like this <span>→</span></a>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        ) : <p className="cs-empty">No case studies in this category yet.</p>}
      </div>
    </section>
  );
}

/* ───────── top creators wall ───────── */
function TopCreators({ c }) {
  const d = c.topCreators;
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('default');
  if (!d) return null;
  const bgs = [['#0b5545', '#04372f'], ['#d9a21b', '#8a5f08'], ['#2e9c86', '#0b5545'], ['#8a2be2', '#3b1370'], ['#e0527a', '#7a1f3a']];
  const list = filterCreators(d.items, q, sort);
  return (
    <section id="creators-wall" className="sec cwall">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="cw-tools">
          <label className="cw-search"><span aria-hidden>🔍</span><input type="search" placeholder="Search creators…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search creators" /></label>
          <label className="cs-sort">Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="default">Featured</option><option value="az">A – Z</option><option value="za">Z – A</option></select>
          </label>
          <span className="cw-count">{list.length} of {d.items.length}</span>
        </div>
        <div className="cw-grid">
          {list.map((x, i) => (
            <motion.div key={x.handle} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
              <a className="cw-card" href={'https://instagram.com/' + x.handle} target="_blank" rel="noreferrer">
                <Tilt className="cw-in" max={10}>
                  <div className="cw-av"><Avatar {...x} bg={bgs[i % 5]} /><span className="cw-ig"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /></svg></span></div>
                  <b>{x.name}</b>
                  <small>@{x.handle}</small>
                  {x.city && <em>📍 {x.city}</em>}
                  <span className="cw-btn">View profile ↗</span>
                </Tilt>
              </a>
            </motion.div>
          ))}
        </div>
        {!list.length && <p className="cs-empty">No creators match “{q}”.</p>}
        <p className="spot-note">{d.note}</p>
      </div>
    </section>
  );
}

/* ───────── references ───────── */
function References({ c }) {
  const d = c.references;
  if (!d) return null;
  return (
    <section id="references" className="sec refs">
      <div className="aurora a1" />
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="ref-grid">
          {d.items.map((x, i) => (
            <Reveal key={i} i={i % 4}>
              <Tilt className="ref" max={8}>
                <span className="ref-badge">✓ Reference available</span>
                <h3>{x.brand}</h3>
                <small>{x.industry}</small>
                <p>{x.outcome}</p>
                <em>{x.since}</em>
              </Tilt>
            </Reveal>
          ))}
        </div>
        <Reveal className="ref-badges">{d.badges.map((b) => <span key={b}>{b}</span>)}</Reveal>
        <Reveal className="ref-cta">
          <a className="btn btn-gold" href={`https://wa.me/${String(c.contact.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(d.ctaText)}`} target="_blank" rel="noreferrer">{d.cta} <span>→</span></a>
          <a className="btn btn-ghost" href="#contact" onClick={go('contact')}>Or send an enquiry</a>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── company profile (PDF) ───────── */
function Profile({ c }) {
  const d = c.profile;
  if (!d) return null;
  return (
    <section id="profile" className="sec profile">
      <div className="wrap profile-in">
        <Reveal className="pcover-wrap">
          <Tilt className="pcover" max={12}>
            <img src={c.brand.logo} alt="" />
            <small>Influencer marketing & creator-led growth agency</small>
            <b>WE DON’T JUST FIND INFLUENCERS. WE BUILD <em>BRAND IMPACT.</em></b>
            <span>10,000+ creators | 70+ brands | 4+ years</span>
            <i className="pages">{d.pages}</i>
          </Tilt>
        </Reveal>
        <div>
          <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
          <Reveal className="why-chips">{d.why.map((w, i) => <span key={w}><b>0{i + 1}</b>{w}</span>)}</Reveal>
          <Reveal i={2} className="profile-cta">
            <Magnetic><a className="btn btn-gold" href={d.file} download target="_blank" rel="noreferrer">⬇ {d.button}</a></Magnetic>
            {d.fileOld && <a className="btn btn-dark" href={d.fileOld} download target="_blank" rel="noreferrer">⬇ {d.buttonOld}</a>}
            <a className="btn btn-dark" href={waLink(c.contact)} target="_blank" rel="noreferrer">💬 Ask on WhatsApp</a>
          </Reveal>
          <small className="disclaimer">{d.disclaimer}</small>
        </div>
      </div>
    </section>
  );
}

/* ───────── creators in action ───────── */
function Proof({ c }) {
  const d = c.proof;
  if (!d) return null;
  const bgs = [['#0b5545', '#04372f'], ['#d9a21b', '#8a5f08'], ['#8a2be2', '#3b1370']];
  return (
    <section id="proof" className="sec proof">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="proof-grid">
          {d.items.map((x, i) => (
            <Reveal key={i} i={i}>
              <Tilt className="reel" max={9}>
                <div className="reel-top">
                  <div className="reel-av"><Avatar {...x} bg={bgs[i % 3]} /></div>
                  <div><b>@{x.handle}{x.verified && <i className="vt" title="Verified">✓</i>}</b><small>{x.name} · {x.niche}</small></div>
                </div>
                <div className="reel-stage">
                  <span className="reel-brand">{d.brand} campaign</span>
                  <motion.div className="reel-play" whileHover={{ scale: 1.1 }}>▶</motion.div>
                  <div className="reel-side"><span>❤</span><b>{x.stat}</b><small>{x.statLabel}</small></div>
                </div>
                <a className="reel-link" href={'https://instagram.com/' + x.handle} target="_blank" rel="noreferrer">View on Instagram ↗</a>
              </Tilt>
            </Reveal>
          ))}
        </div>
        {d.note && <p className="spot-note">{d.note}</p>}
      </div>
    </section>
  );
}

/* ───────── clients: logo wall ───────── */
const WM = ['wm-a', 'wm-b', 'wm-c', 'wm-d', 'wm-e', 'wm-f'];
const slug = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const EXTS = ['svg', 'png', 'webp', 'jpg'];
const Logo = ({ l, i }) => {
  // an uploaded image wins; otherwise try /logos/<brand>.svg|png|webp|jpg; otherwise show the styled name
  const [k, setK] = useState(0);
  const src = l.image || (k < EXTS.length ? `/logos/${slug(l.name)}.${EXTS[k]}` : '');
  return (
    <div className={'logo-tile ' + WM[i % WM.length]} title={l.name}>
      {src ? <img src={src} alt={l.name} loading="lazy" onError={() => (l.image ? setK(EXTS.length) : setK((x) => x + 1))} /> : <span>{l.name}</span>}
    </div>
  );
};
function Clients({ c }) {
  const d = c.clients;
  const logos = d.logos || [];
  const row1 = logos.filter((_, i) => i % 2 === 0), row2 = logos.filter((_, i) => i % 2 === 1);
  return (
    <section id="clients" className="sec clients">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} />
      </div>
      <div className="wall">
        <div className="wall-row"><div className="wall-track">{[...row1, ...row1, ...row1].map((l, i) => <Logo key={i} l={l} i={i} />)}</div></div>
        <div className="wall-row"><div className="wall-track rev">{[...row2, ...row2, ...row2].map((l, i) => <Logo key={i} l={l} i={i + 3} />)}</div></div>
      </div>
      <div className="wrap">
        <div className="client-groups">
          {d.groups.map((g, i) => (
            <Reveal key={i} i={i} className="cgroup">
              <h3>{g.name}</h3>
              <div>{g.brands.map((b) => <motion.span key={b} whileHover={{ y: -4, scale: 1.05 }}>{b}</motion.span>)}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── team ───────── */
function Team({ c }) {
  const d = c.team;
  const bgs = [['#0b5545', '#04372f'], ['#d9a21b', '#8a5f08'], ['#2e9c86', '#0b5545'], ['#8a2be2', '#3b1370']];
  return (
    <section id="team" className="sec">
      <div className="wrap">
        <SectionHead eyebrow={d.eyebrow} title={d.title} text={d.text} />
        <div className="team-grid">
          {d.members.map((m, i) => (
            <Reveal key={i} i={i}>
              <Tilt className="member" max={9}>
                <div className="m-photo">
                  {m.image ? <img src={m.image} alt={m.name} loading="lazy" /> : <Avatar {...m} bg={bgs[i % 4]} />}
                </div>
                <h3>{m.name}</h3>
                <span className="role">{m.role}</span>
                <p>{m.bio}</p>
              </Tilt>
            </Reveal>
          ))}
        </div>
        <Reveal className="exp-band">
          <b><Counter value={c.stats[2]?.value || 4} suffix="+" /></b>
          <span>years of influencer marketing experience · {c.stats[1]?.value}{c.stats[1]?.suffix} brands · {Number(c.stats[0]?.value).toLocaleString('en-IN')}{c.stats[0]?.suffix} creators</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── page ───────── */
export default function Site() {
  const [c, setC] = useState(null);
  const [err, setErr] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [ready, setReady] = useState(() => { try { return /nopre/.test(window.location.search) || !!sessionStorage.getItem('remso_seen'); } catch { return true; } });
  useEffect(() => { if (ready || !c) return; const t = setTimeout(() => { setReady(true); try { sessionStorage.setItem('remso_seen', '1'); } catch { /* ignore */ } }, 1300); return () => clearTimeout(t); }, [ready, c]);

  useEffect(() => {
    fetch('/api/content')
      .then((r) => { if (!r.ok) throw new Error('no api'); return r.json(); })
      .catch(() => import('../../server/defaultContent.js').then((m) => m.default)) // static hosting (e.g. Vercel): use bundled content
      .then(setC)
      .catch(() => setErr(true));
  }, []);

  useEffect(() => {
    if (!c) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute('data-off', !e.isIntersecting)), { rootMargin: '120px' });
    document.querySelectorAll('section, .marquees, footer').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [c]);

  if (err) return <div className="loader"><p>Unable to load content. Please try again shortly.</p></div>;
  if (!c) return <div className="loader"><div className="spin" /></div>;

  return (
    <>
      <Preloader logo={c.brand.logo} name={c.brand.name} done={ready} />
      <Cursor />
      <motion.div className="progress" style={{ scaleX: bar }} />
      <Nav c={c} />
      <main>
        <Hero c={c} />
        <Marquee c={c} />
        <Stats c={c} />
        <Billion c={c} />
        <WhatIs c={c} />
        <Simulator c={c} />
        <Connect c={c} />
        <Creators c={c} />
        <NearView className="map-wrap" margin="400px"><IndiaMap c={c} /></NearView>
        <TopCreators c={c} />
        <Work c={c} />
        <CaseStudies c={c} />
        <Proof c={c} />
        <References c={c} />
        <Profile c={c} />
        <Clients c={c} />
        <Services c={c} />
        <Process c={c} />
        <About c={c} />
        <Team c={c} />
        <FAQ c={c} />
        <Contact c={c} />
      </main>
      <Footer c={c} />
      <Suspense fallback={null}><ChatBot contact={c.contact} logo={c.brand.logo} /></Suspense>
      <a className="wa-float" href={waLink(c.contact)} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm5.200 13.800c-.2.600-1.300 1.200-1.800 1.200-.5.100-1 .2-3.300-.7-2.800-1.100-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .5l-.3.400-.4.500c-.1.100-.3.300-.1.600.2.300.8 1.300 1.700 2.100 1.200 1 2.100 1.300 2.400 1.500.3.100.4.100.6-.1l.8-1c.2-.3.400-.2.600-.1l1.900.9c.3.100.5.200.5.300.1.200.1.700-.1 1.300z"/></svg>
      </a>
    </>
  );
}
