import { Calendar } from 'lucide-react';
import { welcome } from '../../mock/dashboard';

export function WelcomeHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Good morning, {welcome.firstName}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
          Here's what's happening with your account.
        </p>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={2} />
          <span>{welcome.dateLabel}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">{welcome.lastLogin}</span>
      </div>
    </div>
  );
}