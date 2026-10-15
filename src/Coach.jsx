import { useState, useRef, useEffect, useCallback } from 'react';
import { HOST, reduce, readStream, postWithRetry } from './coachClient';

// ─── AI Coach: chat with the eve agent deployed from /coach ─────────
// Talks to eve's default HTTP API (POST /eve/v1/session, NDJSON stream).
// Set VITE_COACH_URL to the agent's deployment URL, e.g. https://ai-pm-coach.vercel.app

const STORE_KEY = 'aipm_coach_session';
const ACCENT = '#0EA5E9';

const STARTERS = [
  { label: '5-minute lesson', text: 'Give me a 5-minute lesson. Start with Day 1.' },
  { label: 'Quiz me', text: 'Quiz me on Day 3: RAG, fine-tuning and prompting.' },
  { label: 'Mock interview', text: 'Run a mock AI PM interview for Anthropic, senior PM level.' },
  { label: "What's new in AI", text: "What are the biggest AI news items this week, and why do they matter for PMs?" },
];

// Tiny, safe markdown: **bold**, `code`, [links](url), bullets, line breaks.
function Rich({ text }) {
  const lines = (text || '').split('\n');
  const inline = (s, k) => {
    const out = []; let rest = s; let n = 0;
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/;
    for (;;) {
      const m = rest.match(re);
      if (!m) { out.push(rest); break; }
      out.push(rest.slice(0, m.index));
      const t = m[0];
      if (t.startsWith('**')) out.push(<strong key={`${k}-${n++}`}>{t.slice(2, -2)}</strong>);
      else if (t.startsWith('`')) out.push(<code key={`${k}-${n++}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em' }}>{t.slice(1, -1)}</code>);
      else out.push(<a key={`${k}-${n++}`} href={m[2]} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>{t.slice(1, t.indexOf(']'))}</a>);
      rest = rest.slice(m.index + t.length);
    }
    return out;
  };
  return lines.map((l, i) => {
    const bullet = l.match(/^\s*([-*•]|\d+\.)\s+(.*)/);
    if (bullet) return <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0' }}><span>{/\d/.test(bullet[1]) ? bullet[1] : '•'}</span><span>{inline(bullet[2], i)}</span></div>;
    if (!l.trim()) return <div key={i} style={{ height: 8 }} />;
    return <div key={i}>{inline(l.replace(/^#+\s*/, ''), i)}</div>;
  });
}

export default function CoachSection({ T }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const sessionRef = useRef(null); // { id, cursor }
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(sessionRef.current)); } catch { /* storage unavailable */ } };
  const apply = useCallback((ev, idx) => {
    setItems(prev => reduce(prev, ev));
    if (sessionRef.current) { sessionRef.current.cursor = idx; save(); }
  }, []);

  // Durable sessions: on reload, replay the saved conversation from eve.
  useEffect(() => {
    if (!HOST) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { /* storage unavailable */ }
    if (!saved?.id) return;
    sessionRef.current = { id: saved.id, cursor: 0 };
    const ctrl = new AbortController(); abortRef.current = ctrl;
    readStream(saved.id, 0, apply, { follow: false, signal: ctrl.signal })
      .catch(() => { sessionRef.current = null; try { localStorage.removeItem(STORE_KEY); } catch { /* storage unavailable */ } setItems([]); });
    return () => ctrl.abort();
  }, [apply]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [items, busy]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput(''); setError(null); setBusy(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      let s = sessionRef.current;
      if (s?.id) {
        try { await postWithRetry(`${HOST}/eve/v1/session/${s.id}`, { message }); }
        catch (e) {
          if (e.code !== 'session_not_active' && e.code !== 'session_stranded') throw e;
          s = null; // expired session: start fresh
        }
      }
      if (!s?.id) {
        setItems([]);
        const res = await postWithRetry(`${HOST}/eve/v1/session`, { message });
        s = sessionRef.current = { id: res.sessionId, cursor: 0 }; save();
      }
      await readStream(s.id, s.cursor, apply, { signal: ctrl.signal });
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Could not reach the coach.');
    } finally { setBusy(false); }
  };

  const newChat = () => {
    abortRef.current?.abort();
    sessionRef.current = null;
    try { localStorage.removeItem(STORE_KEY); } catch { /* storage unavailable */ }
    setItems([]); setError(null); setBusy(false);
  };

  const lastIsUser = items.length > 0 && items[items.length - 1].role !== 'assistant';

  return (
    <div style={{ animation: 'fadeUp 0.45s ease' }}>
      <div style={{ padding: '16px 0 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{'🧑‍🏫'}</span>
            <h2 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>AI Coach</h2>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 4, background: `${ACCENT}15`, color: ACCENT, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' }}>AGENT</span>
          </div>
          <p style={{ color: T.sub, fontSize: 13, margin: '4px 0 0' }}>Lessons, quizzes and mock interviews from a durable agent that remembers your progress.</p>
        </div>
        {items.length > 0 && (
          <button onClick={newChat} style={{ flexShrink: 0, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: T.sub, cursor: 'pointer' }}>New chat</button>
        )}
      </div>

      {!HOST && (
        <div style={{ background: '#FEF3C7', borderRadius: 12, padding: 14, fontSize: 13, color: '#92400E', marginBottom: 12 }}>
          Set <code>VITE_COACH_URL</code> to the coach agent's Vercel URL to turn this on.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
        {items.length === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Pick a starting point</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STARTERS.map(s => (
                <button key={s.label} disabled={!HOST || busy} onClick={() => send(s.text)} style={{
                  border: `1px solid ${ACCENT}40`, background: `${ACCENT}0D`, color: '#0369A1', borderRadius: 999,
                  padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: HOST ? 'pointer' : 'not-allowed',
                }}>{s.label}</button>
              ))}
            </div>
          </div>
        )}

        {items.map(it => {
          if (it.role === 'tool') return (
            <div key={it.id} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.sub, fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: it.done ? T.green : ACCENT, animation: it.done ? 'none' : 'pulse 1s infinite' }} />
              {it.text}
            </div>
          );
          if (it.role === 'error') return (
            <div key={it.id} style={{ alignSelf: 'stretch', background: '#FEE2E2', color: T.red, borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{it.text}</div>
          );
          const mine = it.role === 'user';
          return (
            <div key={it.id} style={{
              alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%',
              background: mine ? T.accent : T.card, color: mine ? '#fff' : T.text,
              border: mine ? 'none' : `1px solid ${T.border}`,
              borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '10px 14px', fontSize: 14.5, lineHeight: 1.5, wordBreak: 'break-word',
            }}>{mine ? it.text : <Rich text={it.text} />}</div>
          );
        })}

        {busy && lastIsUser && (
          <div style={{ alignSelf: 'flex-start', color: T.sub, fontSize: 13, animation: 'pulse 1.2s infinite' }}>Coach is thinking…</div>
        )}
        {error && <div style={{ color: T.red, fontSize: 13 }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={e => { e.preventDefault(); send(input); }} style={{
        position: 'sticky', bottom: 12, marginTop: 16, display: 'flex', gap: 8,
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 6,
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
      }}>
        <input value={input} onChange={e => setInput(e.target.value)} disabled={!HOST}
          placeholder={busy ? 'Coach is replying…' : 'Ask, answer A–D, or say "next"'}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, padding: '8px 10px', background: 'transparent', color: T.text, minWidth: 0 }} />
        <button type="submit" disabled={!HOST || busy || !input.trim()} style={{
          border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 700, fontSize: 14,
          background: busy || !input.trim() ? T.border : ACCENT, color: '#fff', cursor: 'pointer',
        }}>Send</button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 11, color: T.sub, marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>
        Built with eve · running on Vercel
      </div>
    </div>
  );
}
