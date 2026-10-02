import { Camera, Briefcase, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useProfile } from '../../lib/hooks';

export function OrgIdentityBanner() {
  const { data, loading, error } = useProfile();
  const [copied, setCopied] = useState(false);

  // Derive a short, human-readable account ID from the project ID.
  // The full ID is long and ugly (20 chars of hex); this trims to
  // the last 6 characters for display. The copy button copies the
  // full project ID so support can correlate with Firestore logs.
  const projectId = data?.project.id ?? '';
  const shortAccountId = projectId
    ? `PC-${projectId.slice(-6).toUpperCase()}`
    : '—';

  const name =
    data?.customer.organisationName ?? data?.project.name ?? '—';
  const initials = name !== '—' ? name.charAt(0).toUpperCase() : '?';
  const logoLabel = name !== '—' ? name.slice(0, 4).toUpperCase() : '—';

  const status = data?.customer.status ?? 'active';
  const statusLabel = status === 'active' ? 'Active' : 'Suspended';
  const statusNote =
    status === 'active'
      ? 'Your account is active and all services are available.'
      : 'Your account is suspended. Contact support to restore access.';

  const handleCopy = async () => {
    if (!projectId) return;
    try {
      await navigator.clipboard.writeText(projectId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0 w-full md:w-auto">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center p-2 shadow-xs overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0066cc] via-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white font-extrabold text-2xl tracking-tighter">
              {loading ? '·' : initials}
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-widest mt-1">
              {loading ? '···' : logoLabel}
            </span>
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 hover:bg-slate-700 shadow transition-colors"
            title="Logo upload — coming soon"
            disabled
          >
            <Camera className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {loading ? (
              <span className="inline-block w-40 h-6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse align-middle" />
            ) : error ? (
              'Unavailable'
            ) : (
              name
            )}
          </h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-[#1764e0] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
              Business Account
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <span>
              Account ID:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-semibold font-mono">
                {loading ? '···' : shortAccountId}
              </strong>
            </span>
            <button
              onClick={handleCopy}
              disabled={!projectId}
              className="text-slate-500 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
              title="Copy full account ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-4 w-full md:min-w-[260px] md:w-auto shrink-0">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Account Status
        </span>
        <div className="mt-2">
          <span
            className={
              status === 'active'
                ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
            }
          >
            <span
              className={
                status === 'active'
                  ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse'
                  : 'w-2 h-2 rounded-full bg-rose-500'
              }
            />
            {loading ? '···' : statusLabel}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-normal">
          {loading ? '···' : statusNote}
        </p>
      </div>
    </section>
  );
}