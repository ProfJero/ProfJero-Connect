import { AlertCircle, Send } from 'lucide-react';
import { getSegmentInfo } from '@profjero/shared';
import { cn } from '../../lib/utils';
import type { Project } from '@profjero/shared';

interface Props {
  project: Project | null;
  senderId: string;
  recipients: string[];
  message: string;
  walletAvailable: number;
  sending: boolean;
  error: string | null;
  onBack: () => void;
  onSend: () => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-sky-600',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-indigo-600',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function StepReview({
  project,
  senderId,
  recipients,
  message,
  walletAvailable,
  sending,
  error,
  onBack,
  onSend,
}: Props) {
  const seg = getSegmentInfo(message);
  const total = recipients.length * seg.segmentCount;
  const segmentCount = seg.segmentCount;
  const insufficient = walletAvailable < total;
  const shortfall = total - walletAvailable;

  return (
    <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
      <h3 className="text-base font-bold text-slate-900">
        3. Review &amp; Send
      </h3>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {insufficient && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="leading-relaxed">
            <div className="font-semibold">Insufficient balance.</div>
            <div className="mt-0.5">
              This project has {walletAvailable.toLocaleString()} units, but
              needs {total.toLocaleString()}. Add {shortfall.toLocaleString()}{' '}
              more units to the wallet before sending.
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          {project && (
            <>
              <div
                className={cn(
                  'w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0',
                  avatarColor(project.id),
                )}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-medium">
                  Project
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {project.name}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sender ID" value={senderId || '(provider default)'} />
          <Field label="Recipients" value={total.toLocaleString()} />
        </div>

        <div>
          <div className="text-[11px] font-medium text-slate-500 mb-1.5">
            Message
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {message}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Wallet Available"
            value={`${walletAvailable.toLocaleString()} units`}
          />
          <Field
            label="Message Cost"
            value={`${segmentCount} ${segmentCount === 1 ? 'segment' : 'segments'} per recipient`}
          />
          <Field
            label="Total Cost"
            value={`${total.toLocaleString()} ${total === 1 ? 'unit' : 'units'}`}
            highlight
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || insufficient || total === 0}
          className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
          {sending ? 'Sending…' : 'Send SMS'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
      <div
        className={cn(
          'text-xs font-bold mt-0.5',
          highlight ? 'text-[#1976d2]' : 'text-slate-900',
        )}
      >
        {value}
      </div>
    </div>
  );
}