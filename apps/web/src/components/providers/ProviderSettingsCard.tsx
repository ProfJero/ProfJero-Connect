import { useState } from 'react';
import { Pencil, AlertCircle, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { apiFetch, ApiError } from '../../lib/api';
import type { Provider, ProviderResponse } from '@profjero/shared';

interface Props {
  provider: Provider;
  onChanged: () => void;
}

export function ProviderSettingsCard({ provider, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [costPerUnit, setCostPerUnit] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the current values into the form when editing starts.
  const startEditing = () => {
    setCostPerUnit(provider.costPerUnitGhs !== null ? String(provider.costPerUnitGhs) : '');
    setLabel(provider.label);
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    let cost: number | null = null;
    if (costPerUnit.trim()) {
      const n = Number(costPerUnit);
      if (!Number.isFinite(n) || n < 0) {
        setError('Cost must be a non-negative number.');
        return;
      }
      cost = n;
    }
    if (!label.trim()) {
      setError('Label is required.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch<ProviderResponse>(`/admin/providers/${provider.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          costPerUnitGhs: cost,
          label: label.trim(),
        }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Save failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
    setLabel(provider.label);
    setCostPerUnit(
      provider.costPerUnitGhs !== null ? String(provider.costPerUnitGhs) : '',
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Settings</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cost basis used for Reports margin calculations.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition shrink-0"
          >
            <Pencil className="w-3 h-3" strokeWidth={2.5} />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={60}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Cost per unit (GHS)
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              placeholder="e.g. 0.013"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              What the provider charges you per unit. Used to compute margin.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-[11px] font-semibold disabled:opacity-50 transition"
            >
              <Check className="w-3 h-3" strokeWidth={2.5} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Row label="Label" value={provider.label} />
          <Row
            label="Cost per unit"
            value={
              provider.costPerUnitGhs !== null
                ? `GHS ${provider.costPerUnitGhs.toFixed(4)}`
                : 'Not set'
            }
            mono
          />
        </div>
      )}
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-medium text-slate-800 ${mono ? 'font-mono text-[11px]' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}