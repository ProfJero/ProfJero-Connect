import { X, Copy } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { smsDetail } from '../../mock/smsLogs';
import { cn } from '../../lib/utils';

function CopyButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
      className="text-slate-400 hover:text-slate-600 shrink-0"
      type="button"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-slate-400 font-normal shrink-0">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

export function SmsDetailsInspector() {
  const d = smsDetail;

  return (
    <aside
      className="w-full xl:w-[410px] bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col shrink-0"
      data-purpose="details-drawer"
    >
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">SMS Details</h3>
        <button
          aria-label="Close inspector"
          className="text-slate-400 hover:text-slate-600"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {d.statuses.map((s) => (
              <StatusBadge key={s.label} status={s.label} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-medium min-w-0">
            <span className="truncate">{d.messageId}</span>
            <CopyButton label="Copy message ID" />
          </div>
        </div>

        {/* Tabs — horizontal scroll on mobile */}
        <div className="border-b border-slate-200 flex gap-4 pt-1 overflow-x-auto">
          <button
            className="pb-2 text-xs font-semibold text-blue-600 border-b-2 border-blue-600 whitespace-nowrap"
            type="button"
          >
            Message Details
          </button>
          <button
            className="pb-2 text-xs font-medium text-slate-400 hover:text-slate-600 whitespace-nowrap"
            type="button"
          >
            Provider Response
          </button>
          <button
            className="pb-2 text-xs font-medium text-slate-400 hover:text-slate-600 whitespace-nowrap"
            type="button"
          >
            Activity Log
          </button>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Full Message</span>
          <div className="relative bg-slate-50/70 border border-slate-200 rounded-lg p-3 pr-9 text-slate-700 leading-relaxed text-xs">
            {d.fullMessage}
            <button
              aria-label="Copy message text"
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600"
              type="button"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 space-y-2.5 pt-1">
          <MetaRow label="Recipient">
            <div className="flex items-center justify-end gap-1 font-mono font-medium text-slate-700">
              <span className="truncate">{d.recipient}</span>
              <CopyButton label="Copy recipient number" />
            </div>
          </MetaRow>

          <MetaRow label="Sender ID">
            <span className="font-medium text-slate-800">{d.senderId}</span>
          </MetaRow>

          <MetaRow label="Project">
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={cn(
                  'w-4 h-4 rounded-full text-white font-bold text-[9px] flex items-center justify-center',
                  d.projectAvatarBg,
                )}
              >
                {d.project.charAt(0)}
              </span>
              <span className="font-medium text-slate-800">{d.project}</span>
            </div>
          </MetaRow>

          <MetaRow label="Units Consumed">
            <span className="font-bold text-slate-800">{d.unitsConsumed}</span>
          </MetaRow>

          <MetaRow label="Request Time">
            <span className="text-slate-700">{d.requestTime}</span>
          </MetaRow>

          <MetaRow label="Processing Time">
            <span className="text-slate-700">{d.processingTime}</span>
          </MetaRow>

          <MetaRow label="Delivery Status">
            <StatusBadge status={d.deliveryStatus.label} />
          </MetaRow>

          <div className="pt-2">
            <span className="text-slate-400 font-normal block mb-1">Provider Response</span>
            <pre className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-700 overflow-x-auto">
              <code>{d.providerResponse}</code>
            </pre>
          </div>

          <MetaRow label="Error Reason">
            <span className="text-slate-400">{d.errorReason}</span>
          </MetaRow>

          <MetaRow label="Transaction / Reference ID">
            <div className="flex items-center justify-end gap-1 font-mono text-slate-700">
              <span className="truncate">{d.txnReference}</span>
              <CopyButton label="Copy reference ID" />
            </div>
          </MetaRow>
        </div>

        <div className="pt-4">
          <button
            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg text-xs transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </aside>
  );
}