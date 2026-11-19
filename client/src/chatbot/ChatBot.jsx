import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { match, THRESHOLD } from './engine.js';
import { DEFAULT_CHIPS } from './kb.js';

const store = {
  get: () => { try { return JSON.parse(sessionStorage.getItem('remso_chat') || 'null'); } catch { return null; } },
  set: (v) => { try { sessionStorage.setItem('remso_chat', JSON.stringify(v)); } catch { /* ignore */ } }
};

/* tiny markdown: **bold**, *italic*, [text](url) */
function Rich({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i}>
      {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g).map((part, j) => {
        let m;
        if ((m = part.match(/^\*\*(.+)\*\*$/))) return <strong key={j}>{m[1]}</strong>;
        if ((m = part.match(/^\[(.+)\]\((.+)\)$/))) return <a key={j} href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>;
        if ((m = part.match(/^\*(.+)\*$/))) return <em key={j}>{m[1]}</em>;
        return part;
      })}
    </p>
  ));
}

export default function ChatBot({ contact, logo }) {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(() => store.get() || [{ from: 'bot', text: 'Hi! 👋 I’m the **Remso Media** assistant. Ask me about creators, pricing, our process or past results — I know a lot! 😊', chips: DEFAULT_CHIPS }]);
  const lead = useRef({ step: null, data: {} });
  const offer = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const fill = useCallback((t) => t.replaceAll('{phone}', contact.phone).replaceAll('{whatsapp}', String(contact.whatsapp).replace(/\D/g, '')).replaceAll('{email}', contact.email), [contact]);

  useEffect(() => { store.set(msgs.slice(-40)); endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing, open]);
  useEffect(() => {
    const t = setTimeout(() => { if (!sessionStorage.getItem('remso_teaser')) setTeaser(true); }, 7000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (open) { setTeaser(false); try { sessionStorage.setItem('remso_teaser', '1'); } catch { /* ignore */ } setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350); } }, [open]);

  const say = useCallback((text, chips) => new Promise((res) => {
    setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { from: 'bot', text, chips }]); res(); }, Math.min(1300, 450 + text.length * 5));
  }), []);

  const startLead = () => { lead.current = { step: 'name', data: {} }; return say('Happy to help! 🙌 Let me take a few quick details so the team can reach you.\n\n**What’s your name?** (type *cancel* anytime)'); };

  const handleLead = async (text) => {
    const L = lead.current;
    if (/^(cancel|stop|exit|quit|no)$/i.test(text.trim())) { lead.current = { step: null, data: {} }; return say('No problem — cancelled. Ask me anything else!', DEFAULT_CHIPS); }
    if (L.step === 'name') { L.data.name = text.trim().slice(0, 80); L.step = 'phone'; return say(`Nice to meet you, **${L.data.name}**! What’s the best **phone / WhatsApp number** to reach you?`); }
    if (L.step === 'phone') {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 13) return say('That doesn’t look like a valid number — please enter a **10-digit mobile number** (or type *cancel*).');
      L.data.phone = text.trim().slice(0, 30); L.step = 'need';
      return say('Got it ✅ Lastly, **tell us about your brand and goal** (e.g. “skincare brand, want 5M views on Instagram, budget ₹1L”).');
    }
    if (L.step === 'need') {
      L.data.message = 'Via chatbot: ' + text.trim().slice(0, 1500);
      lead.current = { step: null, data: {} };
      try {
        const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: L.data.name, phone: L.data.phone, message: L.data.message }) });
        if (!r.ok) throw new Error();
        return say(`Thank you, **${L.data.name}**! 🎉 Your request is with the team and we’ll contact you shortly.\n\nIn a hurry? [Chat on WhatsApp](https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}) or call **${contact.phone}**.`, ['Pricing', 'Brands you worked with']);
      } catch {
        return say(`Hmm, I couldn’t save that. Please call or WhatsApp us directly on **${contact.phone}** — sorry about that!`);
      }
    }
  };

  const reply = async (text) => {
    if (lead.current.step) return handleLead(text);
    const { intent, score, ranked } = match(text);
    if (intent && score >= THRESHOLD) {
      if (intent.a === '__LEAD__') return startLead();
      if (intent.a === '__YES__') return offer.current === 'lead' ? startLead() : say('Great! 😊 What would you like to know — pricing, creators, process or our past work?', DEFAULT_CHIPS);
      const a = fill(intent.a);
      offer.current = /get quote/i.test(a) ? 'lead' : null;
      return say(a, intent.chips);
    }
    const sugg = (ranked || []).filter((r) => r.score > 0.25 && !/^(\w+:)/.test(r.intent.id)).slice(0, 2).map((r) => r.intent.q[0]).map((q) => q.charAt(0).toUpperCase() + q.slice(1));
    offer.current = 'lead';
    return say('Hmm, I’m not fully sure about that one. 🤔 I can help with **creators, pricing, process, timelines and past results** — or connect you with a human at **' + contact.phone + '**.', [...sugg, 'Talk to the team', 'Pricing']);
  };

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || typing) return;
    setInput('');
    setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), { from: 'user', text: t }]);
    await reply(t);
  };

  const reset = () => { lead.current = { step: null, data: {} }; setMsgs([{ from: 'bot', text: 'Chat cleared. How can I help? 😊', chips: DEFAULT_CHIPS }]); };
  const last = msgs[msgs.length - 1];

  return (
    <>
      <AnimatePresence>
        {teaser && !open && (
          <motion.div className="chat-teaser" initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} onClick={() => setOpen(true)}>
            <button aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); setTeaser(false); try { sessionStorage.setItem('remso_teaser', '1'); } catch { /* ignore */ } }}>✕</button>
            👋 Hi! Need help planning an influencer campaign?
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button className={'chat-fab' + (open ? ' hide' : '')} onClick={() => setOpen(true)} aria-label="Open chat assistant" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: 'spring' }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.500A8 8 0 1 1 21 12z" /><path d="M8.500 11.500h.01M12 11.500h.01M15.500 11.500h.01" strokeWidth="2.600" /></svg>
        <i className="ping" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section className="chat" role="dialog" aria-label="Remso Media assistant" initial={{ opacity: 0, y: 40, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.94 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <header>
              <img src={logo} alt="" />
              <div><b>Remso Assistant</b><span><i /> Online · replies instantly</span></div>
              <button onClick={reset} title="Clear chat" aria-label="Clear chat">↺</button>
              <button onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
            </header>

            <div className="chat-body">
              {msgs.map((m, i) => (
                <motion.div key={i} className={'bub ' + m.from} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Rich text={m.text} />
                </motion.div>
              ))}
              {typing && <div className="bub bot typing"><i /><i /><i /></div>}
              {!typing && last?.from === 'bot' && last.chips && (
                <div className="chips">{last.chips.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>
              )}
              <div ref={endRef} />
            </div>

            <div className="chat-actions">
              <a href={'tel:' + contact.phone.replace(/[^\d+]/g, '')}>📞 Call</a>
              <a href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
              <button onClick={() => send('Get a quote')}>📝 Get quote</button>
            </div>
            <form className="chat-in" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" maxLength={300} aria-label="Your message" enterKeyHint="send" />
              <button disabled={!input.trim() || typing} aria-label="Send">➤</button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
