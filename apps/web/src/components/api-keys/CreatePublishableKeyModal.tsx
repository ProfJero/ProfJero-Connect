import { useState, type FormEvent } from 'react';
import { AlertCircle, AlertTriangle, Plus, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { ApiKeyCreateResponse, RecipientMode } from '@profjero/shared';

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: (response: ApiKeyCreateResponse) => void;
}

const DEFAULT_FORM = {
  name: '',
  recipientMode: 'allowlist' as RecipientMode,
  recipientList: [] as string[],
  rateLimitPerMinute: 5,
  rateLimitPerHour: 30,
  rateLimitPerDay: 100,
  lifetimeUnitCap: 500,
  expiresAt: '',
};

function CreatePublishableKeyModalForm({
  open,
  projectId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>(
    DEFAULT_FORM.recipientMode,
  );
  const [recipientList, setRecipientList] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(
    DEFAULT_FORM.rateLimitPerMinute,
  );
  const [rateLimitPerHour, setRateLimitPerHour] = useState(
    DEFAULT_FORM.rateLimitPerHour,
  );
  const [rateLimitPerDay, setRateLimitPerDay] = useState(
    DEFAULT_FORM.rateLimitPerDay,
  );
  const [lifetimeUnitCap, setLifetimeUnitCap] = useState(
    DEFAULT_FORM.lifetimeUnitCap,
  );
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const addRecipient = () => {
    const v = recipientInput.trim();
    if (v.length === 0) return;
    if (recipientList.includes(v)) {
      setRecipientInput('');
      return;
    }
    setRecipientList([...recipientList, v]);
    setRecipientInput('');
  };

  const removeRecipient = (v: string) => {
    setRecipientList(recipientList.filter((x) => x !== v));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError('A name is required.');
      return;
    }
    if (recipientMode !== 'any' && recipientList.length === 0) {
      setError(
        recipientMode === 'allowlist'
          ? 'Add at least one allowed phone number.'
          : 'Add at least one allowed prefix.',
      );
      return;
    }
    if (
      rateLimitPerMinute <= 0 ||
      rateLimitPerHour <= 0 ||
      rateLimitPerDay <= 0
    ) {
      setError('Rate limits must be positive numbers.');
      return;
    }
    if (lifetimeUnitCap <= 0) {
      setError('Lifetime spend cap must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await apiFetch<ApiKeyCreateResponse>(
        `/admin/projects/${projectId}/api-keys/publishable`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: trimmedName,
            recipientMode,
            recipientList:
              recipientMode === 'any' ? undefined : recipientList,
            rateLimitPerMinute,
            rateLimitPerHour,
            rateLimitPerDay,
            lifetimeUnitCap,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          }),
        },
      );
      onCreated(resp);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Creation failed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create publishable key"
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Publishable keys are safe to embed in browser code. To limit the
          damage if one leaks, you'll set recipient restrictions, rate limits,
          and a lifetime spend cap. All are enforced on every request.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GABS web checkout"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
        </div>

        {/* Recipients */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Recipient restriction <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {(['allowlist', 'prefix', 'any'] as RecipientMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRecipientMode(m)}
                className={cn(
                  'py-2 px-2 rounded-lg text-[11px] font-semibold border transition',
                  recipientMode === m
                    ? m === 'any'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-[#1976d2] border-[#1976d2] text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {m === 'allowlist'
                  ? 'Allowlist'
                  : m === 'prefix'
                    ? 'Prefix'
                    : 'Any'}
              </button>
            ))}
          </div>

          {recipientMode === 'any' ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
              <AlertTriangle
                className="w-4 h-4 shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <span className="leading-relaxed">
                This key can send to <span className="font-semibold">any</span>{' '}
                phone number. Only choose this if you fully trust the
                environment where the key will live. Rate limits and spend cap
                still apply.
              </span>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  placeholder={
                    recipientMode === 'allowlist'
                      ? '+233531207256'
                      : '+23353'
                  }
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  className="px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Add
                </button>
              </div>

              {recipientList.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recipientList.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700"
                    >
                      {r}
                      <button
                        type="button"
                        onClick={() => removeRecipient(r)}
                        className="text-slate-500 hover:text-rose-600"
                        aria-label={`Remove ${r}`}
                      >
                        <X className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-1.5 text-[11px] text-slate-500">
                {recipientMode === 'allowlist'
                  ? 'Exact phone numbers this key may send to.'
                  : 'Phone number prefixes (e.g. +23353 allows any number starting with that).'}
              </p>
            </div>
          )}
        </div>

        {/* Rate limits */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Rate limits <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Per minute"
              value={rateLimitPerMinute}
              onChange={setRateLimitPerMinute}
              suffix="req"
            />
            <NumberField
              label="Per hour"
              value={rateLimitPerHour}
              onChange={setRateLimitPerHour}
              suffix="req"
            />
            <NumberField
              label="Per day"
              value={rateLimitPerDay}
              onChange={setRateLimitPerDay}
              suffix="req"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Each recipient in a batch counts as one request. A 10-recipient
            send consumes 10 slots.
          </p>
        </div>

        {/* Spend cap + expiry */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Lifetime spend cap <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={lifetimeUnitCap}
              onChange={(e) =>
                setLifetimeUnitCap(Math.max(1, Number(e.target.value) || 0))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Max units this key can ever spend.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expiry (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Key stops working after this date.
            </p>
          </div>
        </div>

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
            {submitting ? 'Creating…' : 'Create key'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg border border-slate-200 pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
          {suffix}
        </span>
      </div>
    </div>
  );
}

/**
 * Mounted only while open, so every opening starts from a fresh form
 * (no state-reset effect needed).
 */
export function CreatePublishableKeyModal(props: Props) {
  return props.open ? <CreatePublishableKeyModalForm {...props} /> : null;
}
