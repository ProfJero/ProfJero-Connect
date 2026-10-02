import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { btnPrimary } from '../components/ui/buttons';

/** Services announced but not live yet (Data, Airtime). Honest, not a stub. */
export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 flex-1">
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title} is coming soon</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{description}</p>
        <p className="text-xs text-slate-400 mt-2">
          It will use the same wallet as SMS, so any units you buy today will work for it too.
        </p>
        <Link to="/messaging/sms" className={`${btnPrimary} mt-6`}>
          Send SMS instead
        </Link>
      </div>
    </main>
  );
}
