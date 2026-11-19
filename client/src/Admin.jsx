import { useCallback, useEffect, useState } from 'react';

const TOKEN_KEY = 'remso_admin_token';
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

async function api(path, opts = {}) {
  const r = await fetch(path, {
    ...opts,
    headers: { ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), Authorization: 'Bearer ' + getToken(), ...opts.headers }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; }
  return j;
}

const pretty = (k) => String(k).replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase());
const blank = (v) => (Array.isArray(v) ? [] : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : typeof v === 'number' ? 0 : '');
const isImg = (k) => /image|logo|photo|avatar/i.test(k);

function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      onChange((await api('/api/upload', { method: 'POST', body: fd })).url);
    } catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="img-field">
      {value && <img src={value} alt="" />}
      <div>
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/images/… or upload" />
        <label className="btn-s">{busy ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
      </div>
    </div>
  );
}

function Field({ k, value, onChange }) {
  if (Array.isArray(value)) {
    const move = (i, d) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
    const template = value.length ? blank(value[0]) : '';
    return (
      <div className="f-block">
        <div className="f-title">{pretty(k)} <span>{value.length} items</span></div>
        {value.map((item, i) => (
          <div className="f-item" key={i}>
            <div className="f-item-bar">
              <b>#{i + 1}</b>
              <span>
                <button onClick={() => move(i, -1)} title="Move up">↑</button>
                <button onClick={() => move(i, 1)} title="Move down">↓</button>
                <button className="del" onClick={() => onChange(value.filter((_, x) => x !== i))} title="Remove">✕</button>
              </span>
            </div>
            <Field k={typeof item === 'object' ? 'item' : k} value={item} onChange={(v) => onChange(value.map((x, n) => (n === i ? v : x)))} bare />
          </div>
        ))}
        <button className="btn-s" onClick={() => onChange([...value, template])}>+ Add item</button>
      </div>
    );
  }
  if (value && typeof value === 'object')
    return (
      <div className="f-obj">
        {Object.entries(value).map(([key, v]) => <Field key={key} k={key} value={v} onChange={(nv) => onChange({ ...value, [key]: nv })} />)}
      </div>
    );
  const label = <span className="f-label">{pretty(k)}</span>;
  if (isImg(k)) return <div className="f">{label}<ImageField value={value} onChange={onChange} /></div>;
  if (typeof value === 'number') return <label className="f">{label}<input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>;
  const long = String(value).length > 70 || /text|subtitle|answer|^a$/i.test(k);
  return <label className="f">{label}{long ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}</label>;
}

function Login({ onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { setToken((await api('/api/login', { method: 'POST', body: JSON.stringify({ password: pw }) })).token); onDone(); }
    catch (er) { setErr(er.message); }
  };
  return (
    <div className="admin-login">
      <form onSubmit={submit}>
        <img src="/logo.png" alt="" />
        <h1>Admin login</h1>
        <input type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="btn btn-gold wide">Sign in</button>
        <a href="/">← Back to website</a>
      </form>
    </div>
  );
}

function Leads() {
  const [leads, setLeads] = useState(null);
  const load = useCallback(() => api('/api/leads').then(setLeads).catch(() => setLeads([])), []);
  useEffect(() => { load(); }, [load]);
  if (!leads) return <p>Loading…</p>;
  if (!leads.length) return <p className="muted">No enquiries yet. They will appear here when someone submits the contact form.</p>;
  return (
    <div className="leads">
      {leads.map((l) => (
        <div className="lead-card" key={l.id}>
          <div className="lead-top">
            <b>{l.name}</b>{l.brand && <span> · {l.brand}</span>}
            <small>{new Date(l.createdAt).toLocaleString('en-IN')}</small>
            <button className="del" onClick={async () => { if (confirm('Delete this enquiry?')) { await api('/api/leads/' + l.id, { method: 'DELETE' }); load(); } }}>Delete</button>
          </div>
          <div className="lead-meta">
            {l.email && <a href={'mailto:' + l.email}>{l.email}</a>}
            {l.phone && <a href={'tel:' + l.phone}>{l.phone}</a>}
            {l.budget && <span>Budget: {l.budget}</span>}
          </div>
          {l.message && <p>{l.message}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const [content, setContent] = useState(null);
  const [section, setSection] = useState('hero');
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);

  const logout = () => { setToken(''); setAuthed(false); };
  useEffect(() => {
    if (!authed) return;
    fetch('/api/content').then((r) => r.json()).then(setContent);
  }, [authed]);
  useEffect(() => {
    const on = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', on);
    return () => window.removeEventListener('beforeunload', on);
  }, [dirty]);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  if (!content) return <div className="admin-loading">Loading…</div>;

  const save = async () => {
    setStatus('Saving…');
    try { await api('/api/content', { method: 'PUT', body: JSON.stringify(content) }); setDirty(false); setStatus('Saved ✓ — live on the website'); }
    catch (e) { if (e.status === 401) logout(); setStatus('Error: ' + e.message); }
  };
  const reset = async () => {
    if (!confirm('Reset ALL website content to the original defaults? This cannot be undone.')) return;
    try { setContent(await api('/api/content/reset', { method: 'POST' })); setDirty(false); setStatus('Reset to defaults'); } catch (e) { setStatus('Error: ' + e.message); }
  };

  const keys = Object.keys(content);
  return (
    <div className="admin">
      <aside>
        <div className="a-brand"><img src="/logo.png" alt="" /><b>Admin</b></div>
        <nav>
          {keys.map((k) => <button key={k} className={section === k ? 'on' : ''} onClick={() => setSection(k)}>{pretty(k)}</button>)}
          <hr />
          <button className={section === '__leads' ? 'on' : ''} onClick={() => setSection('__leads')}>📥 Enquiries</button>
        </nav>
        <div className="a-foot">
          <a href="/" target="_blank" rel="noreferrer">View website ↗</a>
          <button onClick={reset}>Reset to defaults</button>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <section className="a-main">
        <div className="a-bar">
          <h2>{section === '__leads' ? 'Enquiries' : pretty(section)}</h2>
          {section !== '__leads' && (
            <div><span className="a-status">{dirty ? 'Unsaved changes' : status}</span><button className="btn btn-gold sm" onClick={save}>Save changes</button></div>
          )}
        </div>
        {section === '__leads' ? <Leads /> : (
          <Field k={section} value={content[section]} onChange={(v) => { setContent({ ...content, [section]: v }); setDirty(true); }} />
        )}
      </section>
    </div>
  );
}
