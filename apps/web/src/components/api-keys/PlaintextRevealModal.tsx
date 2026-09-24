import { useState } from 'react';
import { Check, Copy, AlertTriangle, Key } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface Props {
  open: boolean;
  keyName: string;
  kind: 'secret' | 'publishable';
  plaintext: string;
  /** Optional warning from the create endpoint (e.g. mode 'any'). */
  warning?: string | null;
  onClose: () => void;
}

export function PlaintextRevealModal({
  open,
  keyName,
  kind,
  plaintext,
  warning,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in insecure contexts.
    }
  };

  const handleClose = () => {
    if (!acknowledged) return;
    setCopied(false);
    setAcknowledged(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`${kind === 'secret' ? 'Secret' : 'Publishable'} key created`}
      onClose={handleClose}
      locked={!acknowledged}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              kind === 'secret'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-blue-50 text-blue-600',
            )}
          >
            <Key className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{keyName}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {kind === 'secret'
                ? 'Store this in your server environment. It authorizes full API access.'
                : 'This is safe to embed in browser code, but has restrictions.'}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
          <AlertTriangle
            className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <div className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Save this now.</span> You will not
            see it again. If you lose it, revoke this key and create a new one.
          </div>
        </div>

        {warning && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800 leading-relaxed">
            <span className="font-semibold">Warning:</span> {warning}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
            API Key
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-800 break-all">
              {plaintext}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'shrink-0 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition',
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1976d2] focus:ring-[#1976d2]"
          />
          <span className="text-[11px] text-slate-600 leading-relaxed">
            I have saved this API key. I understand it cannot be retrieved
            again.
          </span>
        </label>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={!acknowledged}
            className="px-5 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}