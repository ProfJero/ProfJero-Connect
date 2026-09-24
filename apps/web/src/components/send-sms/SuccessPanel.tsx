import { CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SendSmsResponse } from '@profjero/shared';

interface Props {
  response: SendSmsResponse;
  onSendAnother: () => void;
}

export function SuccessPanel({ response, onSendAnother }: Props) {
  const { batch } = response;

  return (
    <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Batch submitted</h3>
          <p className="text-xs text-slate-500">
            Your messages have been sent to the provider.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Submitted" value={String(batch.submittedCount)} tone="emerald" />
        <Stat label="Failed" value={String(batch.failedCount)} tone="rose" />
        <Stat label="Unknown" value={String(batch.unknownCount)} tone="amber" />
      </div>

      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Units charged</span>
          <span className="font-semibold text-slate-900">
            {batch.totalUnitsCharged.toLocaleString()}
          </span>
        </div>
        {batch.totalUnitsReleased > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Units released</span>
            <span className="font-semibold text-slate-900">
              {batch.totalUnitsReleased.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Batch ID</span>
          <span className="font-mono text-[11px] text-slate-700 truncate ml-2" title={batch.id}>
            {batch.id}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onSendAnother}
          className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
          Send Another
        </button>
        <Link
          to="/sms-logs"
          className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
        >
          View in SMS Logs
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'rose' | 'amber';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600'
      : tone === 'rose'
        ? 'text-rose-600'
        : 'text-amber-600';
  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${toneClass}`}>{value}</div>
    </div>
  );
}