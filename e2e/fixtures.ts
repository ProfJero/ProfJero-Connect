import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const API = 'http://localhost:8787';
export const ADMIN_URL = 'http://localhost:5173';
export const CUSTOMER_URL = 'http://localhost:5174';

/** Seeded admins (apps/api/test/devServer.ts). Any password works. */
export const ROOT = { uid: 'root', email: 'root@ops.example' };
export const VIEWER = { uid: 'viewer', email: 'viewer@ops.example' };

export const mintToken = async (uid: string, email: string) =>
  (await fetch(`${API}/__test/token?uid=${uid}&email=${encodeURIComponent(email)}`)).text();

/** Call the API as an admin, outside the browser (test setup/teardown). */
export async function adminApi(method: string, path: string, body?: unknown, who = ROOT) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await mintToken(who.uid, who.email)}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status >= 300) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const decodeJwt = (t: string) => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());

/**
 * Stand-in for Firebase Auth's REST endpoints, inside the browser. Sign-in
 * maps an email to a stable uid (seeded admins keep their uid) and returns
 * a real token minted by the dev API, so the API verifies it normally.
 */
async function fakeFirebaseAuth(page: Page) {
  // Hermetic: anything that isn't the local apps/API or the Firebase Auth
  // stand-in below (e.g. web fonts) gets an empty answer, so results don't
  // depend on the network.
  await page.context().route(
    (url) => !['localhost', '127.0.0.1', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com'].includes(url.hostname),
    (route) =>
      // Firebase's popup/redirect helper (loaded on mobile) must fail fast,
      // not "succeed" empty — its onload callback would never fire.
      route.request().url().startsWith('https://apis.google.com/')
        ? route.abort('blockedbyclient')
        : route.fulfill({ status: 200, body: '', contentType: route.request().resourceType() === 'stylesheet' ? 'text/css' : 'text/plain' }),
  );
  const uids = new Map<string, string>([[ROOT.email, ROOT.uid], [VIEWER.email, VIEWER.uid]]);
  const uidFor = (email: string) => {
    if (!uids.has(email)) uids.set(email, `u${uids.size + 1}${Date.now().toString(36)}`);
    return uids.get(email)!;
  };
  await page.context().route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/, async (route) => {
    const req = route.request();
    const url = req.url();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const ok = (json: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json), headers });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = req.postData() ?? '';
    if (url.includes('accounts:signUp') || url.includes('accounts:signInWithPassword')) {
      const { email } = JSON.parse(body);
      const uid = uidFor(email);
      return ok({ kind: 'x', localId: uid, email, idToken: await mintToken(uid, email), refreshToken: `${uid}|${email}`, expiresIn: '3600', registered: true });
    }
    if (url.includes('securetoken.googleapis.com')) {
      const rt = decodeURIComponent(new URLSearchParams(body).get('refresh_token') ?? '');
      const [uid, email] = rt.split('|');
      const t = await mintToken(uid, email);
      return ok({ access_token: t, id_token: t, expires_in: '3600', token_type: 'Bearer', refresh_token: rt, user_id: uid, project_id: 'test-project' });
    }
    if (url.includes('accounts:lookup')) {
      const { idToken } = JSON.parse(body);
      const { sub: uid, email } = decodeJwt(idToken);
      return ok({ kind: 'x', users: [{ localId: uid, email, emailVerified: false, passwordHash: 'x', providerUserInfo: [{ providerId: 'password', email, federatedId: email, rawId: email }], createdAt: '1', lastLoginAt: '1' }] });
    }
    if (url.includes('accounts:update')) {
      const { idToken } = JSON.parse(body);
      const { sub: uid, email } = decodeJwt(idToken);
      return ok({ kind: 'x', localId: uid, email, idToken: await mintToken(uid, email), refreshToken: `${uid}|${email}`, expiresIn: '3600' });
    }
    if (url.includes('sendOobCode')) return ok({ kind: 'x', email: JSON.parse(body).email });
    if (url.includes('recaptchaConfig')) return ok({ recaptchaEnforcementState: [] });
    return ok({});
  });
}

/**
 * Every test page fails on uncaught errors, console errors and API 5xx —
 * a screen that "looks fine" but throws is still broken.
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      await fakeFirebaseAuth(page);
      page.on('pageerror', (e) => problems.push(`pageerror ${page.url()}: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error' && !/favicon|Failed to load resource: (the server responded with a status of 4\d\d|net::ERR_BLOCKED_BY_CLIENT)/.test(m.text())) {
          problems.push(`console ${page.url()}: ${m.text()}`);
        }
      });
      page.on('response', (r) => {
        if (r.status() >= 500 && r.url().startsWith(API)) problems.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      });
      await use(problems);
      expect(problems, problems.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function adminLogin(page: Page, who = ROOT) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill('#email', who.email);
  await page.fill('#password', 'correct horse battery');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
}

let signupSeq = 0;
export async function customerSignup(page: Page, org = 'Test Org') {
  const email = `cust${Date.now().toString(36)}${++signupSeq}@example.com`;
  await page.goto(`${CUSTOMER_URL}/signup`);
  await page.fill('#signup-name', 'Ama Mensah');
  await page.fill('#signup-company', org);
  await page.fill('#signup-email', email);
  await page.fill('#signup-password', 'password123');
  await page.fill('#signup-confirm', 'password123');
  await page.check('input[type=checkbox]');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  return email;
}

/** axe-core scan: serious/critical WCAG 2.1 A/AA violations, as readable lines. */
export async function axeViolations(page: Page, label: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => {
      const nodes = v.nodes.slice(0, 6).map((n) => {
        const d = (n.any[0]?.data ?? {}) as { fgColor?: string; bgColor?: string; contrastRatio?: number };
        const colors = d.fgColor ? ` (${d.fgColor} on ${d.bgColor}, ${d.contrastRatio}:1)` : '';
        return `${n.html.slice(0, 110)}${colors}`;
      });
      return `${label}: [${v.impact}] ${v.id} — ${v.help}\n    ${nodes.join('\n    ')}`;
    });
}

/** No sideways scrolling on small screens. */
export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }));
  expect(scroll, `${label}: page is ${scroll}px wide on a ${width}px screen`).toBeLessThanOrEqual(width + 1);
}
