import { Camera, Briefcase, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { orgIdentity } from '../../mock/organisation';

export function OrgIdentityBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orgIdentity.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0 w-full md:w-auto">
        {/* Logo */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center p-2 shadow-xs overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0066cc] via-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white font-extrabold text-2xl tracking-tighter">
              {orgIdentity.logoInitial}
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-widest mt-1">
              {orgIdentity.logoLabel}
            </span>
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 hover:bg-slate-700 shadow transition-colors">
            <Camera className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>

        {/* Meta */}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {orgIdentity.name}
          </h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
              {orgIdentity.accountType}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
            <span>
              Account ID:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-semibold font-mono">
                {orgIdentity.accountId}
              </strong>
            </span>
            <button
              onClick={handleCopy}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Copy Account ID"
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

      {/* Status */}
      <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 rounded-xl p-4 w-full md:min-w-[260px] md:w-auto shrink-0">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Account Status
        </span>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {orgIdentity.status}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-normal">
          {orgIdentity.statusNote}
        </p>
      </div>
    </section>
  );
}