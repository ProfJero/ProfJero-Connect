import { Check } from 'lucide-react';
import { apiStatus } from '../../mock/api';

export function ApiStatusCard() {
  return (
    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              API Status
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            Live
          </span>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {apiStatus.state}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[210px] leading-relaxed">
              {apiStatus.description}
            </p>
          </div>

          {/* Decorative cloud + code pill */}
          <div className="relative w-28 h-20 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-14 bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-500/10 dark:to-blue-500/5 rounded-full blur-[1px]" />
            </div>
            <div className="absolute right-2 top-2 text-[#1a6cf0] dark:text-blue-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path
                  d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="relative z-10 w-16 h-11 bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <span className="text-white font-mono font-bold text-xs tracking-wider">
                &lt;/&gt;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}