import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  open: boolean;
  title: string;
  label: string;
  /** Called with the entered reason. Parent closes the modal. */
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function RejectReasonModal({
  open,
  title,
  label,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setError('A reason is required.');
      return;
    }
    if (trimmed.length > 300) {
      setError('Max 300 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          The requesting project will see this reason when they check the
          status.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {label} <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being rejected?"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20 resize-none"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {reason.length}/300 characters
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium disabled:opacity-60 transition min-w-[110px]"
          >
            {submitting ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </form>
    </Modal>
  );
}