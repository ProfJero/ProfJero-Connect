import { decodeProtectedHeader, importX509, jwtVerify } from 'jose';
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

export interface VerifiedToken {
  uid: string;
  email: string | null;
  name: string | null;
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
  };
}