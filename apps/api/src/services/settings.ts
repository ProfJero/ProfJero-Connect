import {
  DEFAULT_SETTINGS,
  SETTINGS_SECTIONS,
  SettingsSchemas,
  type PlatformSettings,
  type SettingsSection,
} from '@profjero/shared';
import { firestoreGetDoc, firestoreUpdateDoc } from '../lib/firestore';
import type { Env } from '../types/env';

/**
 * Platform settings (settings/{section}). Reads merge stored values over
 * DEFAULT_SETTINGS and validate each section; an invalid stored section
 * falls back to defaults rather than breaking the request path.
 *
 * Reads are cached per isolate for a short TTL because hot paths (SMS
 * send, signup) consult settings. Writes made through this module clear
 * the local cache immediately; other isolates pick up changes within TTL.
 */

const CACHE_TTL_MS = 30_000;
let cache: { value: PlatformSettings; expiresAt: number; meta: SettingsMeta } | null = null;

export type SettingsMeta = Record<SettingsSection, { updatedAt: string | null; updatedBy: string | null }>;

export async function getSettingsWithMeta(
  env: Env,
  opts: { fresh?: boolean } = {},
): Promise<{ settings: PlatformSettings; meta: SettingsMeta }> {
  if (!opts.fresh && cache && cache.expiresAt > Date.now()) {
    return { settings: cache.value, meta: cache.meta };
  }

  const docs = await Promise.all(
    SETTINGS_SECTIONS.map((s) => firestoreGetDoc(env, 'settings', s)),
  );
  const settings = structuredClone(DEFAULT_SETTINGS) as PlatformSettings;
  const meta = {} as SettingsMeta;

  SETTINGS_SECTIONS.forEach((section, i) => {
    const stored = docs[i]?.data ?? {};
    const { updatedAt, updatedBy, ...values } = stored as Record<string, unknown>;
    const merged = { ...DEFAULT_SETTINGS[section], ...values };
    const parsed = SettingsSchemas[section].safeParse(merged);
    if (parsed.success) {
      (settings as unknown as Record<string, unknown>)[section] = parsed.data;
    } else {
      console.error(`[settings] invalid stored "${section}", using defaults:`, parsed.error.flatten());
    }
    meta[section] = {
      updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
      updatedBy: typeof updatedBy === 'string' ? updatedBy : null,
    };
  });

  cache = { value: settings, meta, expiresAt: Date.now() + CACHE_TTL_MS };
  return { settings, meta };
}

export async function getSettings(env: Env): Promise<PlatformSettings> {
  return (await getSettingsWithMeta(env)).settings;
}

/** Replace one section (validated by the caller) and drop the cache. */
export async function writeSettingsSection<S extends SettingsSection>(
  env: Env,
  section: S,
  values: PlatformSettings[S],
  actor: string,
): Promise<void> {
  await firestoreUpdateDoc(env, 'settings', section, {
    ...(values as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  });
  cache = null;
}

/** For tests: forget cached settings. */
export function resetSettingsCache(): void {
  cache = null;
}
