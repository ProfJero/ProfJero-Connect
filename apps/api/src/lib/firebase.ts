import { decodeProtectedHeader, importPKCS8, importX509, jwtVerify, SignJWT } from 'jose';
import type { Env } from '../types/env';

const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

const certCache = new Map<string, CertCache>();

async function getFirebaseCerts(): Promise<Record<string, string>> {
  const cached = certCache.get('default');
  if (cached && cached.expiresAt > Date.now()) return cached.certs;

  const res = await fetch(FIREBASE_CERT_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase x509 certs (${res.status})`);
  }

  const cacheControl = res.headers.get('cache-control') ?? '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  const certs = (await res.json()) as Record<string, string>;
  certCache.set('default', {
    certs,
    expiresAt: Date.now() + Math.max(maxAgeSec - 60, 60) * 1000,
  });
  return certs;
}

/**
 * `customer` is the custom claim set by POST /customer/register.
 * Absent = false. Only the customer surface reads this.
 */
export interface VerifiedToken {
  uid: string;
  email: string | null;
  name: string | null;
  customer: boolean;
}

export async function verifyFirebaseIdToken(
  token: string,
  env: Env,
): Promise<VerifiedToken> {
  const header = decodeProtectedHeader(token);
  const kid = header.kid;
  if (!kid) throw new Error('ID token is missing a "kid" header.');

  const certs = await getFirebaseCerts();
  const pem = certs[kid];
  if (!pem) {
    certCache.delete('default');
    throw new Error(`No public certificate found for kid "${kid}".`);
  }

  const publicKey = await importX509(pem, 'RS256');
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });

  const uid = typeof payload.sub === 'string' ? payload.sub : null;
  if (!uid) throw new Error('ID token is missing a subject (uid).');

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    customer: payload.customer === true,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Custom claims management (Firebase Auth Admin REST API)
// ─────────────────────────────────────────────────────────────────────

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}
let authAccessTokenCache: AccessTokenCache | null = null;

/**
 * Mints a Google OAuth2 access token scoped to identitytoolkit only
 * (Firebase Auth Admin API). Deliberately separate from the datastore
 * token cache in firestore.ts — each module only requests what it needs.
 */
async function getAuthAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (
    authAccessTokenCache &&
    authAccessTokenCache.expiresAt > now + 60_000
  ) {
    return authAccessTokenCache.token;
  }

  const privateKeyPem = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKeyPem, 'RS256');

  const nowSec = Math.floor(now / 1000);
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setSubject(env.FIREBASE_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 3600)
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Failed to mint Google access token (${res.status}): ${text}`,
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  authAccessTokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in - 60) * 1000,
  };
  return json.access_token;
}

/**
 * Sets custom claims on a Firebase Auth user.
 *
 * Firebase REPLACES the entire customAttributes blob; it does not merge.
 * Do not call on a user with claims you want to keep — merge them into
 * `claims` first.
 */
export async function setCustomUserClaims(
  env: Env,
  uid: string,
  claims: Record<string, unknown>,
): Promise<void> {
  const accessToken = await getAuthAccessToken(env);

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify(claims),
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `setCustomUserClaims failed for uid ${uid} (${res.status}): ${text}`,
    );
  }
}

/** Convenience wrapper — claim name lives in one place. */
export async function setCustomerClaim(env: Env, uid: string): Promise<void> {
  return setCustomUserClaims(env, uid, { customer: true });
}
// ─────────────────────────────────────────────────────────────────────
// Firebase Auth admin operations used by Settings → Team
// ─────────────────────────────────────────────────────────────────────

async function identityToolkit<T>(
  env: Env,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const accessToken = await getAuthAccessToken(env);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    // Firebase puts a code like EMAIL_EXISTS in error.message.
    let code = `HTTP_${res.status}`;
    try {
      code = (JSON.parse(text) as { error?: { message?: string } }).error?.message ?? code;
    } catch {
      /* keep HTTP code */
    }
    throw new Error(`identitytoolkit ${path} failed: ${code}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export interface AuthUserRecord {
  uid: string;
  email: string | null;
  disabled: boolean;
}

/** Find a Firebase Auth user by email, or null. */
export async function lookupAuthUserByEmail(
  env: Env,
  email: string,
): Promise<AuthUserRecord | null> {
  const res = await identityToolkit<{ users?: Array<{ localId: string; email?: string; disabled?: boolean }> }>(
    env,
    `projects/${env.FIREBASE_PROJECT_ID}/accounts:lookup`,
    { email: [email] },
  );
  const u = res.users?.[0];
  return u ? { uid: u.localId, email: u.email ?? null, disabled: !!u.disabled } : null;
}

/**
 * Create a Firebase Auth user with no usable password. The person sets
 * their own password through the link from generatePasswordSetupLink.
 */
export async function createAuthUser(
  env: Env,
  args: { email: string; displayName: string },
): Promise<AuthUserRecord> {
  const res = await identityToolkit<{ localId: string; email?: string }>(
    env,
    `projects/${env.FIREBASE_PROJECT_ID}/accounts`,
    { email: args.email, displayName: args.displayName, emailVerified: false },
  );
  return { uid: res.localId, email: res.email ?? args.email, disabled: false };
}

/** Disable/enable sign-in. Disabling also invalidates refresh tokens. */
export async function setAuthUserDisabled(
  env: Env,
  uid: string,
  disabled: boolean,
): Promise<void> {
  await identityToolkit(env, `projects/${env.FIREBASE_PROJECT_ID}/accounts:update`, {
    localId: uid,
    disableUser: disabled,
    ...(disabled ? { validSince: String(Math.floor(Date.now() / 1000)) } : {}),
  });
}

/** Password reset link (also used as the "set your password" invite). */
export async function generatePasswordSetupLink(env: Env, email: string): Promise<string> {
  const res = await identityToolkit<{ oobLink?: string }>(
    env,
    `projects/${env.FIREBASE_PROJECT_ID}/accounts:sendOobCode`,
    { requestType: 'PASSWORD_RESET', email, returnOobLink: true },
  );
  if (!res.oobLink) throw new Error('identitytoolkit did not return a reset link');
  return res.oobLink;
}
