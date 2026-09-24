import {
  FileText,
  Users,
  AlignJustify,
  Package,
  Wallet,
  Check,
  Info,
  Send,
  Download,
} from 'lucide-react';
import { walletInfo, messageDetails, selectedContacts, messageMetrics } from '../../mock/sendSms';

export function MessageSummary() {
  return (
    <aside className="lg:col-span-4" data-purpose="message-summary-sidebar">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-1">
          <FileText className="w-5 h-5 text-blue-500" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Message Summary
          </h3>
        </div>

        {/* Metrics list */}
        <div className="space-y-3 pt-1">
          <Row icon={Users} label="Recipients" value={selectedContacts.count.toString()} />
          <Row icon={AlignJustify} label="Segments" value={messageMetrics.segments.toString()} />
          <Row
            icon={Package}
            label="Estimated Units"
            value={messageMetrics.estimatedUnits.toString()}
          />
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Wallet balance */}
        <div className="flex items-center gap-3">
          <Wallet className="w-4 h-4 text-blue-500" strokeWidth={2} />
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
              Wallet Balance
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {walletInfo.balance.toLocaleString()} units
            </div>
          </div>
        </div>

        {/* Sufficient alert */}
        {walletInfo.sufficient && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Check className="w-3 h-3" strokeWidth={3} />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                Sufficient balance
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                You have enough units to send this message.
              </div>
            </div>
          </div>
        )}

        {/* Message details */}
        <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs mb-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
              <Info className="w-2.5 h-2.5" strokeWidth={3} />
            </div>
            <span>Message Details</span>
          </div>
          <div className="text-[11px] space-y-1.5 pt-1">
            <DetailRow label="Sender ID" value={messageDetails.senderId} />
            <DetailRow label="Message Length" value={messageDetails.messageLength} />
            <DetailRow label="Segments" value={messageDetails.segments} />
            <DetailRow label="Estimated Units" value={messageDetails.estimatedUnits} />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white py-2.5 px-4 rounded-lg font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
            type="button"
          >
            <Send className="w-4 h-4 -rotate-45" strokeWidth={2} />
            <span>Send Message</span>
          </button>
          <button
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" strokeWidth={2} />
            <span>Save as Draft</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon className="w-4 h-4 text-blue-500" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}:</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium text-right">{value}</span>
    </div>
  );
}