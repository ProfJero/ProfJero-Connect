import { Calendar } from 'lucide-react';
import { useAuth } from '../../lib/auth';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeHeader() {
  const { user } = useAuth();
  const now = new Date();
  const firstName = user?.displayName.split(' ')[0] ?? '';
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {greeting(now.getHours())}
          {firstName && `, ${firstName}`}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
          Here's what's happening with {user?.companyName ?? 'your account'}.
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" strokeWidth={2} />
        <span>{dateLabel}</span>
      </div>
    </div>
  );
}
