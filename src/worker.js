/**
 * ECN Group — Espace Formation : porte d'entrée (Cloudflare Worker)
 *
 * Aucune page n'est servie sans session. La session naît uniquement d'un ticket à usage unique
 * créé par ecn-group.com (/api/auth, action formation-ticket) pour un membre connecté :
 *   ecn-group.com → /auth/callback?t=TICKET → ticket consommé dans la base ECN → cookie signé.
 * À chaque chargement de page, le pack est relu dans la base : une adhésion suspendue ou expirée
 * coupe l'accès immédiatement.
 *
 * Variables Cloudflare : SUPABASE_SERVICE_ROLE_KEY (secret, la même que ecn-group.com),
 * SESSION_SECRET (secret, 32+ caractères aléatoires), SUPABASE_URL (facultatif).
 */

const DEFAULT_SUPABASE_URL = 'https://jwnbsukmgpissvdytbmx.supabase.co';
const COOKIE = '__Host-ecn_formation';
const SESSION_TTL_S = 7 * 24 * 3600;
// Packs ECN (users.pack) → niveau d'accès de l'Espace Formation ; les autres packs n'y ont pas accès
const TIERS = { initie: 'initie', golden: 'membre', fondateur: 'fondateur' };
// Seules ressources visibles sans session : la page de connexion et son logo
const PUBLIC_PATHS = new Set(['/connexion', '/connexion.html', '/assets/logo-ecn.webp', '/robots.txt']);

const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

export function formationTier(u) {
  if (!u || u.status !== 'active') return null;
  if (u.role === 'admin') return 'fondateur';
  return u.pack_status === 'active' ? TIERS[u.pack] || null : null;
}

// Noms (jamais les valeurs) des variables absentes, affichés sur /connexion pour guider la mise en service
const missingVars = env => [
  !String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim() && 'SUPABASE_SERVICE_ROLE_KEY',
  String(env.SESSION_SECRET || '').trim().length < 32 && 'SESSION_SECRET'
].filter(Boolean);
const configured = env => missingVars(env).length === 0;
// + noms des variables reçues par cette version (repère une faute de frappe ou une variable posée sur un autre Worker)
const configRedirect = env => redirect(`/connexion?e=config&manque=${missingVars(env).join(',')}&recues=${Object.keys(env).filter(k => /^[A-Za-z0-9_]{1,64}$/.test(k)).join(',')}`);

async function sb(env, path, { method = 'GET', body, prefer } = {}) {
  const url = String(env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

const member = async (env, id) => ((await sb(env, `users?select=id,first_name,last_name,member_code,status,role,pack,pack_status,formation_linked_at&id=eq.${encodeURIComponent(id)}`)) || [])[0] || null;

async function hmacKey(env) {
  return crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sessionCookie(env, uid) {
  const payload = `${uid}.${Math.floor(Date.now() / 1000) + SESSION_TTL_S}`;
  const sig = b64url(await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(payload)));
  return `${COOKIE}=${payload}.${sig}; Path=/; Max-Age=${SESSION_TTL_S}; HttpOnly; Secure; SameSite=Lax`;
}
const clearCookie = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

/** Identifiant du membre si le cookie est intact et non expiré, sinon null. */
export async function readSession(request, env) {
  if (!configured(env)) return null;
  const raw = (request.headers.get('Cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  const m = raw && raw.slice(COOKIE.length + 1).match(/^([0-9a-f-]{36})\.(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!m || +m[2] < Date.now() / 1000) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', await hmacKey(env), fromB64url(m[3]), enc.encode(`${m[1]}.${m[2]}`)); } catch { ok = false; }
  return ok ? m[1] : null;
}

const sha256Hex = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text)))].map(b => b.toString(16).padStart(2, '0')).join('');

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Robots-Tag': 'noindex, nofollow'
};
function redirect(location, extra = {}) {
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', ...SECURITY_HEADERS, ...extra } });
}
function withHeaders(res, extra) {
  const out = new Response(res.body, res);
  Object.entries({ ...SECURITY_HEADERS, ...extra }).forEach(([k, v]) => out.headers.set(k, v));
  return out;
}

/** Retour depuis ecn-group.com : le ticket est supprimé en le lisant (usage unique, 2 min). */
async function callback(env, url) {
  if (!configured(env)) return configRedirect(env);
  const t = url.searchParams.get('t') || '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(t)) return redirect('/connexion?e=lien');
  const hash = await sha256Hex(t);
  const rows = await sb(env, `formation_tickets?token_hash=eq.${hash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`, { method: 'DELETE' });
  const ticket = rows && rows[0];
  if (!ticket) return redirect('/connexion?e=lien');
  const user = await member(env, ticket.user_id);
  if (!formationTier(user)) return redirect('/connexion?e=adhesion', { 'Set-Cookie': clearCookie });
  if (!user.formation_linked_at) {
    await sb(env, `users?id=eq.${encodeURIComponent(user.id)}`, { method: 'PATCH', prefer: 'return=minimal', body: { formation_linked_at: new Date().toISOString() } });
  }
  return redirect('/', { 'Set-Cookie': await sessionCookie(env, user.id) });
}

/** Page de l'espace : profil relu dans la base, puis injecté dans la page (pack, prénom). */
async function app(request, env, uid) {
  const user = await member(env, uid);
  const tier = formationTier(user);
  if (!tier) return redirect('/connexion?e=adhesion', { 'Set-Cookie': clearCookie });
  // requête neuve, sans en-têtes conditionnels : jamais de 304 vers une ancienne page sans profil
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url), { headers: { Accept: 'text/html' } }));
  const data = JSON.stringify({
    id: user.id, tier, firstName: user.first_name || '', lastName: user.last_name || '', memberCode: user.member_code || ''
  }).replace(/</g, '\\u003c');
  const html = new HTMLRewriter()
    .on('head', { element(el) { el.append(`<script>window.ECN_MEMBER=${data};</script>`, { html: true }); } })
    .transform(page);
  return withHeaders(html, { 'Cache-Control': 'no-store' });
}

const wantsPage = (request, path) => path === '/' || path.endsWith('.html') || (request.headers.get('Accept') || '').includes('text/html');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === '/auth/callback') return await callback(env, url);
      if (path === '/logout') return redirect('/connexion?e=deconnecte', { 'Set-Cookie': clearCookie });
      // message « configuration » périmé une fois les variables en place : on le retire
      if (path === '/connexion' && url.searchParams.get('e') === 'config' && configured(env)) return redirect('/connexion');
      if (PUBLIC_PATHS.has(path)) return withHeaders(await env.ASSETS.fetch(request), {});
      const uid = await readSession(request, env);
      if (!uid) {
        return wantsPage(request, path)
          ? (configured(env) ? redirect('/connexion') : configRedirect(env))
          : new Response('Accès réservé aux membres ECN Group.', { status: 401, headers: SECURITY_HEADERS });
      }
      if (path === '/' || path === '/index.html') return await app(request, env, uid);
      return withHeaders(await env.ASSETS.fetch(request), {});
    } catch (err) {
      console.error('[formation]', err);
      return redirect('/connexion?e=indisponible');
    }
  }
};
