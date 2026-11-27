// Summarise a saved browser state file (Playwright storage state) without ever printing a value.
import { readFileSync, statSync } from 'node:fs';

const hostOf = (u) => { try { return new URL(u).hostname; } catch { return null; } };
// A cookie domain ".example.com" matches example.com and its subdomains.
const cookieMatches = (domain, host) => {
  const d = String(domain ?? '').replace(/^\./, '').toLowerCase();
  return !!host && (host === d || host.endsWith('.' + d));
};

// Returns { ok, problems[], cookies, storage, earliestExpiry (Date|null), expired, worldReadable }
export function summariseState(file, appUrl, { now = Date.now(), text } = {}) {
  const out = { ok: false, problems: [], cookies: 0, storage: 0, earliestExpiry: null, expired: false, worldReadable: false };
  let raw = text;
  if (raw === undefined) {
    try { raw = readFileSync(file, 'utf8'); } catch { out.problems.push('file not found'); return out; }
    try { out.worldReadable = process.platform !== 'win32' && (statSync(file).mode & 0o077) !== 0; } catch { /* ignore */ }
  }
  let state;
  try { state = JSON.parse(raw); } catch { out.problems.push('not valid JSON'); return out; }
  if (!state || !Array.isArray(state.cookies)) { out.problems.push('not a browser state file (no cookies list)'); return out; }
  const host = hostOf(appUrl);
  const origin = (() => { try { return new URL(appUrl).origin; } catch { return null; } })();
  const mine = state.cookies.filter((c) => cookieMatches(c.domain, host));
  out.cookies = mine.length;
  out.storage = (state.origins ?? []).filter((o) => o.origin === origin)
    .reduce((n, o) => n + (o.localStorage?.length ?? 0), 0);
  const expiries = mine.map((c) => c.expires).filter((e) => typeof e === 'number' && e > 0).map((e) => e * 1000);
  if (expiries.length) {
    out.earliestExpiry = new Date(Math.min(...expiries));
    out.expired = expiries.every((e) => e <= now);
  }
  if (out.cookies + out.storage === 0) out.problems.push(`nothing saved for ${host ?? appUrl}; the login may not have finished`);
  if (out.expired) out.problems.push('every saved cookie for the app has expired');
  out.ok = out.problems.length === 0;
  return out;
}
