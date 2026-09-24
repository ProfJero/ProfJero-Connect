import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import type { WalletListEntry, Wallet } from '@profjero/shared';

export type WalletActionMode = 'credit' | 'debit' | 'threshold';

interface Props {
  open: boolean;
  mode: WalletActionMode;
  entries: WalletListEntry[];
  /** Pre-select this project when opening. */
  presetProjectId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const COPY: Record<
  WalletActionMode,
  { title: string; submit: string; help: string }
> = {
  credit: {
    title: 'Add Units',
    submit: 'Add Units',
    help: 'Credits the wallet immediately. Creates a manual_credit ledger entry.',
  },
  debit: {
    title: 'Deduct Units',
    submit: 'Deduct Units',
    help: 'Debits the wallet immediately. Fails if the wallet has insufficient available units.',
  },
  threshold: {
    title: 'Set Low-Balance Threshold',
    submit: 'Save Threshold',
    help: 'Alert when available units fall below this number. Leave empty to clear.',
  },
};

export function WalletActionModal({
  open,
  mode,
  entries,
  presetProjectId,
  onClose,
  onSaved,
}: Props) {
  const [projectId, setProjectId] = useState('');
  const [units, setUnits] = useState('');
  const [description, setDescription] = useState('');
  const [threshold, setThreshold] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open / mode / preset change.
  useEffect(() => {
    if (!open) return;
    setProjectId(presetProjectId ?? entries[0]?.project.id ?? '');
    setUnits('');
    setDescription('');
    const preset = presetProjectId
      ? entries.find((e) => e.project.id === presetProjectId)
      : null;
    setThreshold(
      preset?.wallet.lowBalanceThreshold != null
        ? String(preset.wallet.lowBalanceThreshold)
        : '',
    );
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, presetProjectId]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const currentEntry = entries.find((e) => e.project.id === projectId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Select a project.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'threshold') {
        const trimmed = threshold.trim();
        const value = trimmed === '' ? null : Number(trimmed);
        if (value !== null && (!Number.isFinite(value) || value < 0)) {
          setError('Threshold must be a non-negative number, or empty to clear.');
          setSubmitting(false);
          return;
        }
        await apiFetch<{ wallet: Wallet }>(
          `/admin/wallets/${projectId}/threshold`,
          {
            method: 'POST',
            body: JSON.stringify({ threshold: value }),
          },
        );
      } else {
        const n = Number(units);
        if (!Number.isInteger(n) || n <= 0) {
          setError('Enter a positive whole number of units.');
          setSubmitting(false);
          return;
        }
        if (!description.trim()) {
          setError('Description is required.');
          setSubmitting(false);
          return;
        }
        const path =
          mode === 'credit'
            ? `/admin/wallets/${projectId}/credit`
            : `/admin/wallets/${projectId}/debit`;
        await apiFetch(path, {
          method: 'POST',
          body: JSON.stringify({
            units: n,
            description: description.trim(),
          }),
        });
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.requestId ? `${err.message} (${err.requestId})` : err.message,
        );
      } else {
        setError(err instanceof Error ? err.message : 'Action failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copy = COPY[mode];

  return (
    <Modal
      open={open}
      title={copy.title}
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">{copy.help}</p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Project picker */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Project <span className="text-rose-500">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          >
            <option value="">Select a project…</option>
            {entries.map((entry) => (
              <option key={entry.project.id} value={entry.project.id}>
                {entry.project.name} ({entry.wallet.availableUnits.toLocaleString()} available)
              </option>
            ))}
          </select>
        </div>

        {/* Units + description (credit/debit) */}
        {(mode === 'credit' || mode === 'debit') && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
              />
              {currentEntry && mode === 'debit' && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Available: {currentEntry.wallet.availableUnits.toLocaleString()} units
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  mode === 'credit'
                    ? 'e.g. Initial funding'
                    : 'e.g. Correcting over-credit'
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Appears in the ledger as the reason for this entry.
              </p>
            </div>
          </>
        )}

        {/* Threshold (threshold mode) */}
        {mode === 'threshold' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Threshold (units)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 500 — leave empty to clear"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Currently:{' '}
              {currentEntry?.wallet.lowBalanceThreshold != null
                ? `${currentEntry.wallet.lowBalanceThreshold.toLocaleString()} units`
                : 'default (500)'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-60 transition min-w-[120px]"
          >
            {submitting ? 'Saving…' : copy.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
}