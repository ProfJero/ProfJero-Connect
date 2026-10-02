import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import type { ApiKeyCreateResponse } from '@profjero/shared';

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: (response: ApiKeyCreateResponse) => void;
}

function CreateSecretKeyModalForm({
  open,
  projectId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('A name is required.');
      return;
    }
    if (trimmed.length > 100) {
      setError('Max 100 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await apiFetch<ApiKeyCreateResponse>(
        `/admin/projects/${projectId}/api-keys`,
        {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
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
    <Modal open={open} title="Create secret key" onClose={handleClose} locked={submitting}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Secret keys are for your server-side code. They authorize full API
          access for this project. Never embed one in a browser or mobile app.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production backend"
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            A label to help you remember what this key is for.
          </p>
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

/**
 * Mounted only while open, so every opening starts from a fresh form
 * (no state-reset effect needed).
 */
export function CreateSecretKeyModal(props: Props) {
  return props.open ? <CreateSecretKeyModalForm {...props} /> : null;
}
