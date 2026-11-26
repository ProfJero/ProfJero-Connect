import { useState } from 'react';
import { Check, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { InitiatePaymentResponse } from '@profjero/shared';

interface Props {
  open: boolean;
  response: InitiatePaymentResponse | null;
  onClose: () => void;
}

function formatGhs(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PaymentUrlModal({ open, response, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!response) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.authorizationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail in insecure contexts.
    }
  };

  return (
    <Modal open={open} title="Payment link created" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[11px] text-blue-900 leading-relaxed">
            Send this URL to <span className="font-semibold">{response.payment.customerEmail}</span>.
            The wallet will credit automatically once Paystack confirms payment.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Amount</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {formatGhs(response.payment.amountPesewas)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-500 font-medium">Units</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {response.payment.units.toLocaleString()}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
            Payment URL
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-800 break-all">
              {response.authorizationUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={
                'shrink-0 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ' +
                (copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
              }
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

        <div className="text-[11px] text-slate-500">
          Reference:{' '}
          <span className="font-mono text-slate-700">{response.payment.reference}</span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <a
            href={response.authorizationUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
            Open
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}