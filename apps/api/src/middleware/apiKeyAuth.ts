import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  findApiKeysByPrefix,
  markApiKeyUsed,
} from '../repositories/apiKeys';
import { hashSecret, parseApiKey, timingSafeEqual } from '../services/apiKeys';
import type { ApiKey } from '@profjero/shared';
import type { Env } from '../types/env';

export interface ApiKeyVariables {
  apiKey: ApiKey;
  requestId: string;
}

export const requireApiKey: MiddlewareHandler<{
  Bindings: Env;
  Variables: ApiKeyVariables;
}> = async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing API key.' });
  }
  const token = header.slice('Bearer '.length).trim();

  const parsed = parseApiKey(token);
  if (!parsed) {
    // Deliberately generic message — don't tell attackers whether the
    // prefix format was wrong vs. the secret.
    throw new HTTPException(401, { message: 'Invalid API key.' });
  }

  const candidates = await findApiKeysByPrefix(c.env, parsed.prefix);
  if (candidates.length === 0) {
    throw new HTTPException(401, { message: 'Invalid API key.' });
  }

  const presentedHash = await hashSecret(parsed.secret);

  // Iterate candidates. In the ~unimaginable event of a prefix collision,
  // exactly one hash will match. Constant-time compare guards against
  // timing side-channels on the hash.
  let matched: ApiKey | null = null;
  for (const { key, hash } of candidates) {
    if (timingSafeEqual(hash, presentedHash)) {
      matched = key;
      break;
    }
  }

  if (!matched) {
    throw new HTTPException(401, { message: 'Invalid API key.' });
  }

  if (matched.status !== 'active') {
    throw new HTTPException(401, { message: 'Invalid API key.' });
  }

  if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
    throw new HTTPException(401, { message: 'API key has expired.' });
  }

  // Best-effort usage tracking — never blocks the request.
  void markApiKeyUsed(c.env, matched.id, matched.lastUsedAt);

  c.set('apiKey', matched);
  await next();
};