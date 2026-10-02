import { useState } from 'react';
import type { PlatformSettings, SettingsSection } from '@profjero/shared';
import { apiFetch, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';

export interface SettingsResponse {
  settings: PlatformSettings;
  meta: Record<SettingsSection, { updatedAt: string | null; updatedBy: string | null }>;
  canEdit: Record<SettingsSection, boolean>;
}

export type SaveMessage = { tone: 'success' | 'error'; text: string };

/** Load all settings once; save one section at a time. */
export function useSettings() {
  const api = useApi<SettingsResponse>('/admin/settings');
  const [saving, setSaving] = useState<SettingsSection | null>(null);

  const save = async <S extends SettingsSection>(section: S, values: PlatformSettings[S]): Promise<SaveMessage> => {
    setSaving(section);
    try {
      await apiFetch(`/admin/settings/${section}`, { method: 'PUT', body: JSON.stringify(values) });
      api.reload();
      return { tone: 'success', text: 'Saved. Changes take effect within 30 seconds.' };
    } catch (err) {
      return { tone: 'error', text: err instanceof ApiError ? err.message : 'Save failed.' };
    } finally {
      setSaving(null);
    }
  };

  return { ...api, save, saving };
}
