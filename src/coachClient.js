// Minimal client for eve's default HTTP API (the /coach agent).
// POST /eve/v1/session to start, POST /eve/v1/session/:id to follow up,
// GET /eve/v1/session/:id/stream for the NDJSON event stream.

export const HOST = (import.meta.env.VITE_COACH_URL || '').replace(/\/$/, '');

const TERMINAL = new Set(['session.waiting', 'session.failed', 'session.completed']);

// Fold one eve stream event into the list of chat items.
export function reduce(items, ev) {
  const d = ev.data || {};
  const key = `${d.turnId}:${d.stepIndex}:${d.sequence}`;
  const upsert = (id, fn, make) => {
    const i = items.findIndex(x => x.id === id);
    if (i === -1) return [...items, make()];
    const next = items.slice(); next[i] = fn(items[i]); return next;
  };
  switch (ev.type) {
    case 'message.received':
      return items.some(x => x.id === `u:${d.turnId}:${d.sequence}`) ? items
        : [...items, { id: `u:${d.turnId}:${d.sequence}`, role: 'user', text: d.message }];
    case 'message.appended':
      return upsert(`a:${key}`, x => ({ ...x, text: x.text + d.messageDelta }),
        () => ({ id: `a:${key}`, role: 'assistant', text: d.messageDelta }));
    case 'message.completed':
      return upsert(`a:${key}`, x => ({ ...x, text: d.message }),
        () => ({ id: `a:${key}`, role: 'assistant', text: d.message }));
    case 'actions.requested': {
      let next = items;
      for (const a of d.actions || []) {
        const callId = a.callId || a.id;
        if (!callId || next.some(x => x.id === `t:${callId}`)) continue;
        const label = d.presentation?.[callId]?.label || String(a.name || a.toolName || 'Working').replace(/_/g, ' ');
        next = [...next, { id: `t:${callId}`, role: 'tool', text: label, done: false }];
      }
      return next;
    }
    case 'action.result': {
      const callId = d.result?.callId;
      return callId ? items.map(x => x.id === `t:${callId}` ? { ...x, done: true } : x) : items;
    }
    case 'turn.failed':
    case 'session.failed':
      return [...items, { id: `e:${ev.meta?.id || Math.random()}`, role: 'error', text: d.message || 'Something went wrong. Try again.' }];
    default:
      return items;
  }
}

export async function postWithRetry(url, body) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      if (err.code === 'session_not_ready' || err.error === 'session_not_ready') {
        await new Promise(r => setTimeout(r, 300 * 2 ** attempt)); continue;
      }
      throw Object.assign(new Error(err.message || 'Session ended'), { code: err.code || err.error || 'conflict' });
    }
    if (!res.ok) throw new Error(`Coach returned ${res.status}`);
    return res.json();
  }
  throw new Error('Coach is still starting. Try again.');
}

// Read the session's NDJSON stream from `cursor` until the session parks.
export async function readStream(sessionId, cursor, onEvent, { follow = true, signal } = {}) {
  let idx = cursor;
  for (let reconnects = 0; reconnects < 5; reconnects++) {
    const q = follow ? `startIndex=${idx}` : `startIndex=${idx}&follow=false`;
    const res = await fetch(`${HOST}/eve/v1/session/${sessionId}/stream?${q}`, { signal });
    if (!res.ok) throw Object.assign(new Error(`Stream ${res.status}`), { status: res.status });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let parked = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (!ev || typeof ev.type !== 'string') continue;
        idx++;
        onEvent(ev, idx);
        if (follow && TERMINAL.has(ev.type)) parked = true;
      }
      if (parked) { reader.cancel().catch(() => {}); return idx; }
    }
    if (!follow) return idx;
  }
  return idx;
}

