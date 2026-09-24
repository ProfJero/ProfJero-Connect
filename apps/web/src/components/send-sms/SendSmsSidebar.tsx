import { Mail, Users, MessageSquare, Wallet, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { Project, Wallet as WalletType } from '@profjero/shared';
import { getSegmentInfo } from '@profjero/shared';

interface Props {
  project: Project | null;
  senderId: string;
  recipientCount: number;
  message: string;
  wallet: WalletType | null;
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

export function SendSmsSidebar({
  project,
  senderId,
  recipientCount,
  message,
  wallet,
}: Props) {
  const seg = getSegmentInfo(message);
  const units = recipientCount * seg.segmentCount;
  const balance = wallet?.availableUnits ?? 0;
  const sufficient = balance >= units;

  return (
    <div className="sm:col-span-5 space-y-5">
      {/* Summary */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Message Summary</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryPill
            icon={
              project ? (
                <div
                  className={cn(
                    'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center',
                    avatarColor(project.id),
                  )}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100" />
              )
            }
            label="Project"
            value={project?.name ?? '—'}
            sub={project?.contactEmail ?? 'Not selected'}
          />
          <SummaryPill
            icon={
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-4 h-4" strokeWidth={2} />
              </div>
            }
            label="Sender ID"
            value={senderId || '—'}
            sub={senderId ? 'Custom' : 'Provider default'}
          />
          <SummaryPill
            icon={
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" strokeWidth={2} />
              </div>
            }
            label="Recipients"
            value={String(recipientCount)}
            sub={recipientCount === 1 ? 'recipient' : 'recipients'}
          />
          <SummaryPill
            icon={
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" strokeWidth={2} />
              </div>
            }
            label="Units Required"
            value={String(units)}
            sub={units === 1 ? 'unit' : 'units'}
          />
        </div>
      </Card>

      {/* Wallet */}
      {project && wallet && (
        <div
          className={cn(
            'rounded-xl p-3.5 flex items-center justify-between gap-3 border',
            sufficient
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-amber-50 border-amber-100',
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                sufficient
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600',
              )}
            >
              <Wallet className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div
                className={cn(
                  'text-[11px] font-medium',
                  sufficient ? 'text-emerald-800' : 'text-amber-800',
                )}
              >
                Available Units
              </div>
              <div className="text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                {balance.toLocaleString()}
              </div>
            </div>
          </div>
          {units > 0 && (
            <span
              className={cn(
                'px-2.5 py-1 rounded-md bg-white border text-[11px] font-semibold shadow-xs shrink-0',
                sufficient
                  ? 'border-emerald-200 text-emerald-600'
                  : 'border-amber-200 text-amber-600',
              )}
            >
              {sufficient ? 'Sufficient' : `Short by ${units - balance}`}
            </span>
          )}
        </div>
      )}

      {/* Message preview */}
      {message.trim().length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600 -rotate-45" strokeWidth={2} />
            <h3 className="text-sm font-bold text-slate-900">Preview</h3>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
            {message}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-3 bg-slate-50/90 rounded-lg border border-slate-100 flex items-center gap-2.5">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 font-medium">{label}</div>
        <div className="text-xs font-bold text-slate-900 leading-tight truncate">
          {value}
        </div>
        <div className="text-[10px] text-slate-400 leading-tight truncate">
          {sub}
        </div>
      </div>
    </div>
  );
}