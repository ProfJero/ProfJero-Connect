import { Users, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { getSegmentInfo } from '@profjero/shared';

interface Props {
  recipientsText: string;
  onRecipientsChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  recipientCount: number;
  onBack: () => void;
  onNext: () => void;
}

export function StepCompose({
  recipientsText,
  onRecipientsChange,
  message,
  onMessageChange,
  recipientCount,
  onBack,
  onNext,
}: Props) {
  const canContinue = recipientCount > 0 && message.trim().length > 0;
  const seg = getSegmentInfo(message);
  const totalUnits = recipientCount * seg.segmentCount;

  return (
    <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
      <h3 className="text-base font-bold text-slate-900">2. Compose Message</h3>

      {/* Recipients */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Recipients <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute top-3 left-3 text-slate-500 pointer-events-none">
            <Users className="w-4 h-4" strokeWidth={2} />
          </span>
          <textarea
            value={recipientsText}
            onChange={(e) => onRecipientsChange(e.target.value)}
            rows={6}
            placeholder={'+233241234567\n+233551234567\n+233201234567'}
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
          <span>One phone number per line. Duplicates are allowed.</span>
          <span className="font-semibold text-slate-700">
            {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute top-3 left-3 text-slate-500 pointer-events-none">
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
          </span>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Type your message here..."
            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
          <span>
            {seg.characterCount} character{seg.characterCount === 1 ? '' : 's'}
            {seg.encoding === 'UCS-2' && ' · Unicode (UCS-2)'}
          </span>
          <span>
            {seg.segmentCount} segment{seg.segmentCount === 1 ? '' : 's'}
          </span>
        </div>
        {seg.nonGsmChars.length > 0 && (
          <p className="mt-1.5 text-[11px] text-amber-700">
            Message contains characters outside GSM-7 ({seg.nonGsmChars.slice(0, 5).join(' ')})
            — billed at UCS-2 rates (67 chars per segment).
          </p>
        )}
      </div>

      {/* Cost preview */}
      {recipientCount > 0 && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
            <h4 className="text-xs font-semibold text-slate-800">
              Estimated Cost
            </h4>
          </div>
          <div className="text-sm text-slate-700">
            {recipientCount} recipient{recipientCount === 1 ? '' : 's'} ×{' '}
            {seg.segmentCount} segment{seg.segmentCount === 1 ? '' : 's'} per
            message ={' '}
            <span className="font-bold text-slate-900">
              {totalUnits.toLocaleString()}{' '}
              {totalUnits === 1 ? 'unit' : 'units'}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
            <Info className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={2} />
            <span>
              One message segment = 160 GSM-7 characters (153 when split across
              segments), or 70 UCS-2 characters (67 when split).
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          Continue to Review →
        </button>
      </div>
    </div>
  );
}