import { useState } from 'react';
import { ChevronDown, Wallet, AlertCircle, BadgeCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type {
  Project,
  Wallet as WalletType,
  SenderIdAssignment,
} from '@profjero/shared';

interface Props {
  projects: Project[];
  projectId: string | null;
  onProjectChange: (id: string) => void;
  senderId: string;
  onSenderIdChange: (v: string) => void;
  senderIds: SenderIdAssignment[];
  senderIdsLoading: boolean;
  wallet: WalletType | null;
  walletLoading: boolean;
  onNext: () => void;
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

export function StepProjectSelect({
  projects,
  projectId,
  onProjectChange,
  senderId,
  onSenderIdChange,
  senderIds,
  senderIdsLoading,
  wallet,
  walletLoading,
  onNext,
}: Props) {
  const [senderDropdownOpen, setSenderDropdownOpen] = useState(false);

  const selected = projects.find((p) => p.id === projectId) ?? null;
  const approvedSenderIds = senderIds.filter((s) => s.status === 'approved');
  const hasApproved = approvedSenderIds.length > 0;
  const canContinue = !!projectId && !!senderId && hasApproved;

  return (
    <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
      <h3 className="text-base font-bold text-slate-900">
        1. Select Project
      </h3>

      {/* Project picker */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Project <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={projectId ?? ''}
            onChange={(e) => onProjectChange(e.target.value)}
            className="appearance-none w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-9 bg-white text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.status !== 'active' ? `(${p.status})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {selected && (
          <div className="mt-2.5 flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div
              className={cn(
                'w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0',
                avatarColor(selected.id),
              )}
            >
              {selected.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">
                {selected.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {selected.description ?? selected.contactEmail ?? 'No description'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sender ID dropdown — only when a project is chosen */}
      {projectId && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Sender ID <span className="text-red-500">*</span>
          </label>

          {senderIdsLoading ? (
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
          ) : !hasApproved ? (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="w-4 h-4 shrink-0 mt-0.5 text-amber-600"
                  strokeWidth={2}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-amber-800">
                    No approved Sender IDs for this project
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    {senderIds.length === 0
                      ? 'No Sender IDs have been requested or assigned yet.'
                      : 'All Sender IDs for this project are still awaiting approval.'}
                  </p>
                  <Link
                    to="/sender-ids"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                    Manage Sender IDs
                  </Link>
                </div>
              </div>

              {senderIds.filter((s) => s.status !== 'approved').length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-1">
                  {senderIds
                    .filter((s) => s.status !== 'approved')
                    .map((s) => (
                      <div
                        key={s.senderId}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="font-mono text-slate-700">
                          {s.senderId}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                            s.status === 'pending' &&
                              'bg-amber-100 text-amber-700 border-amber-300',
                            s.status === 'rejected' &&
                              'bg-rose-100 text-rose-700 border-rose-300',
                            s.status === 'revoked' &&
                              'bg-slate-100 text-slate-600 border-slate-300',
                          )}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSenderDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BadgeCheck
                    className="w-4 h-4 text-emerald-500 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-mono font-medium truncate">
                    {senderId || 'Select a Sender ID…'}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 shrink-0 transition-transform',
                    senderDropdownOpen && 'rotate-180',
                  )}
                />
              </button>

              {senderDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSenderDropdownOpen(false)}
                  />
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
                    {approvedSenderIds.map((s) => (
                      <button
                        key={s.senderId}
                        type="button"
                        onClick={() => {
                          onSenderIdChange(s.senderId);
                          setSenderDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm font-mono hover:bg-slate-50 transition',
                          s.senderId === senderId && 'bg-blue-50 text-blue-700',
                        )}
                      >
                        {s.senderId}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wallet balance */}
      {projectId && (
        <div>
          {walletLoading ? (
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ) : wallet ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-600">
                    Available Units
                  </div>
                  <div className="text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                    {wallet.availableUnits.toLocaleString()}
                  </div>
                </div>
              </div>
              {wallet.reservedUnits > 0 && (
                <span className="text-[11px] text-slate-500 shrink-0">
                  {wallet.reservedUnits.toLocaleString()} reserved
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>Could not load wallet balance.</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          Continue to Compose →
        </button>
      </div>
    </div>
  );
}