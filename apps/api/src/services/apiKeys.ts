const SECRET_PREFIX = 'pk_live_';
const PUBLISHABLE_PREFIX = 'pub_live_';

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface GeneratedKey {
  plaintext: string;
  prefix: string;
  hash: string;
}

async function generateKeyWithPrefix(prefixString: string): Promise<GeneratedKey> {
  const prefixBytes = new Uint8Array(9);
  crypto.getRandomValues(prefixBytes);
  const prefix = toHex(prefixBytes);

  const secretBytes = new Uint8Array(24);
  crypto.getRandomValues(secretBytes);
  const secret = base64url(secretBytes);

  const plaintext = `${prefixString}${prefix}_${secret}`;
  const hash = await hashSecret(secret);
  return { plaintext, prefix, hash };
}

/** Secret key: pk_live_<18hex>_<32base64url>. Server-side use only. */
export async function generateApiKey(): Promise<GeneratedKey> {
  return generateKeyWithPrefix(SECRET_PREFIX);
}

/** Publishable key: pub_live_<18hex>_<32base64url>. Safe to embed in browsers. */
export async function generatePublishableApiKey(): Promise<GeneratedKey> {
  return generateKeyWithPrefix(PUBLISHABLE_PREFIX);
}

export async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface ParsedApiKey {
  kind: 'secret' | 'publishable';
  prefix: string;
  secret: string;
}

/**
 * Parse either "pk_live_<prefix>_<secret>" or "pub_live_<prefix>_<secret>".
 * Returns null on any shape mismatch.
 */
export function parseApiKey(token: string): ParsedApiKey | null {
  let kind: 'secret' | 'publishable';
  let rest: string;

  if (token.startsWith(PUBLISHABLE_PREFIX)) {
    kind = 'publishable';
    rest = token.slice(PUBLISHABLE_PREFIX.length);
  } else if (token.startsWith(SECRET_PREFIX)) {
    kind = 'secret';
    rest = token.slice(SECRET_PREFIX.length);
  } else {
    return null;
  }

  const idx = rest.indexOf('_');
  if (idx <= 0 || idx === rest.length - 1) return null;
  return {
    kind,
    prefix: rest.slice(0, idx),
    secret: rest.slice(idx + 1),
  };
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}