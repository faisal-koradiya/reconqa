// ReconQA API driver core (REST/JSON over HTTP): everything except the MCP wire protocol, so tests
// can run it with a fake fetch. Settings come from app.api in .reconqa/kit.yml.
//
// Safety rules (checked on every call):
//   - requests go only to app.api.base_url's origin; a path is always relative ("/users/1")
//   - GET, HEAD and OPTIONS are free
//   - POST, PUT and PATCH need app.test_data.allow_create and a local or test server (loopback
//     host, or an environment of kind local, test or staging); never production
//   - PUT, PATCH and DELETE only on records this run created (from the POST response)
//   - logins use credentials from environment variables named in the kit: the model never sees
//     them; tokens, cookies and password-like fields are removed from what the model reads

export class DriverError extends Error {}

const SECRET_KEY = /pass(word)?|secret|token|authorization|auth|cookie|session|\bsid\b|hash|salt|api[-_]?key|credential|jwt|access|refresh|otp|csrf|xsrf|bearer|pin\b|ssn/i;
// POSTs ReconQA never sends: they act on existing records or settings rather than create a test record.
const RISKY_POST = /delete|remove|reset|password|passwd|role|admin|permission|grant|refund|pay|charge|transfer|withdraw|order|checkout|purchase|invite|email|sms|notify|token|graphql/i;
// A path segment that names one record: digits, a UUID, or a mixed letters-and-digits id (not v1, v2...).
const isIdSegment = (seg) => !/^v\d+$/i.test(seg) && (/^\d+$/.test(seg) || /^[0-9a-f-]{32,36}$/i.test(seg) || (/\d/.test(seg) && /[A-Za-z]/.test(seg) && seg.length >= 6));
const READ = new Set(['GET', 'HEAD', 'OPTIONS']);
const WRITE = new Set(['POST', 'PUT', 'PATCH']);
const ENV_NAME = /^[A-Z_][A-Z0-9_]*$/;
const isLoopback = (h) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(h);

// ---- settings ---------------------------------------------------------------

export function settings(config) {
  const app = config?.app ?? {};
  const a = app.api ?? {};
  if (app.target !== 'api') throw new DriverError('app.target is not "api" in .reconqa/kit.yml, so the API driver is off.');
  let base;
  try { base = new URL(a.base_url); } catch { throw new DriverError('Set app.api.base_url in .reconqa/kit.yml, e.g. http://localhost:3001'); }
  if (!/^https?:$/.test(base.protocol) || base.username || base.password) throw new DriverError('app.api.base_url must be http(s) with no user:password in it.');
  const envs = app.environments ?? [];
  const env = envs.find((e) => { try { return new URL(e.url).origin === base.origin; } catch { return false; } }) ?? null;
  if (env?.kind === 'production') throw new DriverError(`"${env.name}" is a production environment. ReconQA does not explore production APIs.`);
  const testServer = isLoopback(base.hostname) || ['local', 'test', 'staging'].includes(env?.kind);
  for (const v of [a.token_env, ...Object.values(a.login?.body_env ?? {})].filter(Boolean)) {
    if (!ENV_NAME.test(v)) throw new DriverError(`${v} is not an environment variable name (use LIKE_THIS).`);
  }
  return {
    base, basePath: base.pathname.replace(/\/$/, ''), spec: a.spec ?? null, tokenEnv: a.token_env ?? null, login: a.login ?? null,
    allowWrite: app.test_data?.allow_create === true && testServer,
    testServer, prefix: app.test_data?.prefix ?? 'reconqa', env,
  };
}

// A path relative to the base URL. Absolute URLs, "//host", backslashes and ".." are refused.
export function resolvePath(st, path, query) {
  const p = String(path ?? '');
  if (!p.startsWith('/') || p.startsWith('//') || /[\\\s]/.test(p) || /(^|\/)\.\.?(\/|$)/.test(p) || /^[a-z]+:/i.test(p) || /%(2e|2f|5c|00)/i.test(p)) {
    throw new DriverError('path must be relative to the API base, like /users/1 (no full URLs, no "..").');
  }
  const url = new URL(st.basePath + p, st.base.origin);
  if (url.origin !== st.base.origin) throw new DriverError('That path leaves the API server.');
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.append(k, String(v));
  return url;
}

// ---- secrets ----------------------------------------------------------------

export function redact(value, depth = 0) {
  if (depth > 20) return '[deep]';
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEY.test(k) && v !== null && v !== '' ? '[hidden]' : redact(v, depth + 1);
    return out;
  }
  if (typeof value === 'string' && /^(Bearer\s+)?eyJ[\w-]+\.[\w-]+\.[\w-]*$/.test(value)) return '[hidden token]';
  return value;
}

const SHOW_HEADERS = ['content-type', 'location', 'allow', 'retry-after', 'www-authenticate', 'x-total-count'];

export async function readResponse(res, max = 6000, secretValues = []) {
  const type = res.headers.get('content-type') ?? '';
  const raw = await res.text();
  let body = raw, json = null;
  if (/json/i.test(type) || /^\s*[[{]/.test(raw)) {
    try { json = JSON.parse(raw); body = JSON.stringify(redact(json), null, 2); } catch { /* not JSON after all */ }
  }
  if (json === null) body = body.replace(/(eyJ[\w-]+\.[\w-]+\.[\w-]*)/g, '[hidden token]');
  for (const v of secretValues) if (v && v.length >= 4) body = body.split(v).join('[hidden]');
  const cut = body.length > max ? body.slice(0, max) + `\n… (${body.length - max} more characters)` : body;
  const headers = SHOW_HEADERS.map((h) => [h, res.headers.get(h)]).filter(([, v]) => v);
  return { status: res.status, statusText: res.statusText ?? '', headers, body: cut, json };
}

export function render(method, url, r, st) {
  const lines = [`${method} ${url.pathname}${url.search} → ${r.status} ${r.statusText}`.trim()];
  for (const [h, v] of r.headers) lines.push(`${h}: ${h === 'location' ? v.replace(st.base.origin, '').replace(/[?#].*$/, '') : v}`);
  if (r.body) lines.push('', r.body);
  return lines.join('\n');
}

// ---- OpenAPI summary --------------------------------------------------------

// Short list of endpoints from an OpenAPI 3 / Swagger 2 object: method, path, summary, required
// body fields and documented responses.
export function summariseSpec(spec) {
  if (!spec || typeof spec !== 'object' || !spec.paths) throw new DriverError('The spec has no "paths". ReconQA reads OpenAPI 3 or Swagger 2 JSON or YAML.');
  const deref = (o, seen = 0) => {
    if (!o || typeof o !== 'object' || seen > 10) return o;
    if (typeof o.$ref === 'string' && o.$ref.startsWith('#/')) {
      return deref(o.$ref.slice(2).split('/').reduce((x, k) => x?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], spec), seen + 1);
    }
    return o;
  };
  const lines = [`${spec.info?.title ?? 'API'} ${spec.info?.version ?? ''}`.trim()];
  for (const [path, ops] of Object.entries(spec.paths)) {
    for (const [m, op] of Object.entries(ops ?? {})) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(m)) continue;
      const schema = deref(deref(op.requestBody)?.content?.['application/json']?.schema)
        ?? deref((op.parameters ?? []).map(deref).find((p) => p?.in === 'body')?.schema);
      const req = schema?.required?.length ? ` required: ${schema.required.join(', ')}` : '';
      const props = schema?.properties ? ` fields: ${Object.entries(schema.properties).map(([k, v]) => {
        const d = deref(v) ?? {};
        const lim = [d.type, d.format, d.minLength !== undefined && `min ${d.minLength}`, d.maxLength !== undefined && `max ${d.maxLength}`,
          d.pattern && `pattern ${d.pattern}`, d.minimum !== undefined && `≥${d.minimum}`, d.maximum !== undefined && `≤${d.maximum}`, d.enum && `one of ${d.enum.join('|')}`].filter(Boolean).join(' ');
        return lim ? `${k} (${lim})` : k;
      }).join(', ')}` : '';
      const resp = Object.entries(op.responses ?? {}).map(([code, r]) => `${code}${deref(r)?.description ? ' ' + deref(r).description : ''}`).join('; ');
      lines.push(`${m.toUpperCase()} ${path}${op.summary ? ' — ' + op.summary : ''}${req}${props}${resp ? ` | responses: ${resp}` : ''}`);
    }
  }
  return lines.join('\n');
}

// ---- the driver -------------------------------------------------------------

// fetchImpl(url, init) -> Response; readSpec(ref) -> object (parsed spec); env: process.env
export function createDriver({ config, fetchImpl = fetch, readSpec = null, env = process.env, timeoutMs = 15000 }) {
  const created = new Set();   // paths of records created in this run
  const cookies = new Map();   // cookie jar from api_login (never shown)
  const s = () => settings(config());
  // Values of the login variables: hidden from any response that echoes them.
  const secrets = () => { const st = s(); return [st.tokenEnv, ...Object.values(st.login?.body_env ?? {})].filter(Boolean).map((n) => env[n]).filter(Boolean); };

  const headers = (st, extra = {}) => {
    const h = { accept: 'application/json', ...extra };
    if (st.tokenEnv) {
      const t = env[st.tokenEnv];
      if (!t) throw new DriverError(`Environment variable ${st.tokenEnv} (app.api.token_env) is empty. Set it in the terminal before starting Claude Code.`);
      h.authorization = /^\S+\s/.test(t) ? t : `Bearer ${t}`;
    }
    if (cookies.size) h.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    return h;
  };
  const keepCookies = (res) => {
    const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    for (const c of list) { const m = c.match(/^\s*([^=;\s]+)=([^;]*)/); if (m) cookies.set(m[1], m[2]); }
  };
  async function send(st, method, url, body) {
    const init = { method, headers: headers(st, body !== undefined ? { 'content-type': 'application/json' } : {}), redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) };
    if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
    let res;
    try { res = await fetchImpl(url, init); }
    catch (e) { throw new DriverError(`No answer from ${st.base.origin} (${e.cause?.code ?? e.name}). Is the API running?`); }
    keepCookies(res);
    return res;
  }
  const ownRecord = (url) => [...created].some((c) => url.pathname === c || url.pathname.startsWith(c + '/'));
  function remember(st, url, r) {
    if (r.status < 200 || r.status > 299) return null;
    const base = url.pathname.replace(/\/$/, '');
    const loc = r.headers.find(([h]) => h === 'location')?.[1];
    let path = null;
    // Only a Location strictly below the POST path counts (never "/" or the collection itself).
    if (loc) { try { const u = new URL(loc, st.base.origin); if (u.origin === st.base.origin && u.pathname.startsWith(base + '/') && u.pathname.length > base.length + 1) path = u.pathname.replace(/\/$/, ''); } catch { /* ignore */ } }
    // A top-level id, or the id of a single wrapper object ({account: {id}}); never a nested
    // object next to other keys ({order: …, customer: {id}} could name someone else's record).
    const j = r.json && typeof r.json === 'object' && !Array.isArray(r.json) ? r.json : null;
    const keys = j ? Object.keys(j) : [];
    const rec = j && (j.id !== undefined ? j : keys.length === 1 && j[keys[0]] && typeof j[keys[0]] === 'object' && !Array.isArray(j[keys[0]]) ? j[keys[0]] : null);
    const id = rec?.id;
    if (!path && (typeof id === 'string' || typeof id === 'number') && /^[A-Za-z0-9_-]+$/.test(String(id))) path = `${base}/${id}`;
    if (path) created.add(path);
    return path;
  }

  return {
    async api_spec() {
      const st = s();
      if (!st.spec) return 'No spec set (app.api.spec). Explore from the docs or tickets you have, with GET requests first.';
      if (!readSpec) throw new DriverError('Reading the spec is not available here.');
      return summariseSpec(await readSpec(st.spec, st));
    },
    async api_get(args = {}) {
      const st = s();
      const method = String(args.method ?? 'GET').toUpperCase();
      if (!READ.has(method)) throw new DriverError('api_get sends GET, HEAD or OPTIONS. Use api_send for POST, PUT or PATCH.');
      const url = resolvePath(st, args.path, args.query);
      return render(method, url, await readResponse(await send(st, method, url), undefined, secrets()), st);
    },
    async api_send(args = {}) {
      const st = s();
      const method = String(args.method ?? '').toUpperCase();
      if (!WRITE.has(method)) throw new DriverError('method must be POST, PUT or PATCH.');
      if (!st.allowWrite) {
        throw new DriverError(st.testServer
          ? 'Creating or changing data is off. Set app.test_data.allow_create: true in .reconqa/kit.yml to allow it on this test server.'
          : 'Creating or changing data is only allowed on a local or test server (localhost, or an environment of kind local, test or staging).');
      }
      const url = resolvePath(st, args.path, args.query);
      if (method !== 'POST' && !ownRecord(url)) {
        throw new DriverError(`${method} is only allowed on records this run created (${created.size ? [...created].join(', ') : 'none yet'}).`);
      }
      if (method === 'POST' && !ownRecord(url)) {
        const segs = url.pathname.split('/').filter(Boolean);
        if (RISKY_POST.test(url.pathname)) throw new DriverError(`ReconQA does not send POST ${url.pathname}: it looks like it changes existing data, settings or money, or is GraphQL. Note it as a manual check for a person.`);
        if (segs.some(isIdSegment)) throw new DriverError(`POST ${url.pathname} acts on an existing record (the path names one). ReconQA only creates new records in collections, or works under records this run created.`);
      }
      const r = await readResponse(await send(st, method, url, args.body), undefined, secrets());
      let note = '';
      if (method === 'POST') {
        const p = remember(st, url, r);
        if (p) note = `\n\n(Created ${p}; it may be changed or deleted in this run.)`;
        if (p && !JSON.stringify(args.body ?? '').includes(st.prefix)) note += `\nWarning: the request had no "${st.prefix}" value, so this record is hard to spot as test data.`;
      }
      return render(method, url, r, st) + note;
    },
    async api_delete(args = {}) {
      const st = s();
      if (!st.allowWrite) throw new DriverError('Deleting is off: it needs app.test_data.allow_create on a local or test server.');
      const url = resolvePath(st, args.path);
      if (!ownRecord(url)) throw new DriverError(`DELETE is only allowed on records this run created (${created.size ? [...created].join(', ') : 'none yet'}).`);
      const r = await readResponse(await send(st, 'DELETE', url), undefined, secrets());
      if (r.status >= 200 && r.status < 300) created.delete(url.pathname);
      return render('DELETE', url, r, st);
    },
    async api_login() {
      const st = s();
      const l = st.login;
      if (!l?.path || !l.body_env) throw new DriverError('No login set. Add app.api.login (path and body_env) to .reconqa/kit.yml, or use app.api.token_env.');
      const body = {};
      for (const [field, name] of Object.entries(l.body_env)) {
        if (!env[name]) throw new DriverError(`Environment variable ${name} is empty. Set it in the terminal before starting Claude Code; ReconQA never asks for passwords.`);
        body[field] = env[name];
      }
      const url = resolvePath(st, l.path);
      const res = await send(st, String(l.method ?? 'POST').toUpperCase(), url, body);
      const status = res.status;
      await res.text().catch(() => '');
      return status >= 200 && status < 400
        ? `Logged in (${status}). The session is kept for the next requests; it is not shown.`
        : `Login failed (${status}). Check the test account in the environment variables.`;
    },
    async api_created() {
      return created.size ? `Records created in this run:\n${[...created].join('\n')}` : 'No records created in this run.';
    },
  };
}

const PATHQ = { path: { type: 'string', description: 'Path relative to the API base, e.g. /users/1' }, query: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean'] } } };
export const TOOL_LIST = [
  ['api_spec', 'Endpoints from the team\'s API spec (app.api.spec): methods, paths, required fields, limits and documented responses.', {}],
  ['api_get', 'Send a GET (or HEAD/OPTIONS) request and read status, key headers and body. Secrets are hidden.', { ...PATHQ, method: { type: 'string', enum: ['GET', 'HEAD', 'OPTIONS'] } }, ['path']],
  ['api_send', 'Send POST, PUT or PATCH with a JSON body. Only with allow_create on a test server; PUT/PATCH only on records this run created.', { ...PATHQ, method: { type: 'string', enum: ['POST', 'PUT', 'PATCH'] }, body: {} }, ['method', 'path']],
  ['api_delete', 'Delete a record this run created.', { path: PATHQ.path }, ['path']],
  ['api_login', 'Log in with the test account from environment variables (app.api.login). The password is never shown.', {}],
  ['api_created', 'List the records created in this run (for the atlas and clean-up).', {}],
].map(([name, description, properties, required = []]) => ({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false } }));
