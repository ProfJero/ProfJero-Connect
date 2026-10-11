import { Link } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { CUSTOMER_SERVICES, serviceById, type ServiceId } from '../lib/services';
import { cn } from '../lib/utils';

/** A service that's announced but can't be bought yet. Honest, with somewhere useful to go next. */
export function ComingSoonPage({ serviceId }: { serviceId: ServiceId }) {
  const s = serviceById(serviceId);
  const Icon = s.icon;
  const alternatives = CUSTOMER_SERVICES.filter((x) => x.status === 'live' && x.id !== s.id);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className={cn('rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br p-8 text-center', s.accent.gradient)}>
          <span className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto', s.accent.tile)}>
            <Icon className="w-7 h-7" strokeWidth={2} />
          </span>
          <span className="mt-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3" strokeWidth={2.5} /> Coming soon
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">{s.description}</p>
          <ul className="mt-5 inline-flex flex-wrap justify-center gap-x-5 gap-y-2">
            {s.highlights.map((h) => (
              <li key={h} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Check className={cn('w-3.5 h-3.5', s.accent.text)} strokeWidth={2.5} /> {h}
              </li>
            ))}
          </ul>
        </div>

        {alternatives.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2.5">Available now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alternatives.map((a) => {
                const AIcon = a.icon;
                return (
                  <Link key={a.id} to={a.primary.path} className={cn('flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all hover:shadow-sm', a.accent.hoverBorder)}>
                    <span className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', a.accent.tile)}>
                      <AIcon className="w-5 h-5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{a.primary.label}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{a.tagline}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
