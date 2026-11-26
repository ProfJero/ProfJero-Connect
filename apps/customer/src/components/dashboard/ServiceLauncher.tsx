import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CUSTOMER_SERVICES, networkStyle, type ServiceDef } from '../../lib/services';
import { useWallet, usePlatformConfig } from '../../lib/account';
import { useApi } from '../../lib/useApi';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { DataCatalog } from '../../lib/types';

/**
 * Top of the dashboard: every service as a big, obvious card, so a new
 * customer sees straight away that this is more than an SMS tool.
 */
export function ServiceLauncher() {
  const { data: wallet } = useWallet();
  const catalog = useApi<DataCatalog>('/customer/data/bundles');
  const { supportEmail } = usePlatformConfig();

  const fromPrice = catalog.data?.bundles.length
    ? Math.min(...catalog.data.bundles.map((b) => b.sellPriceGhs))
    : null;

  const detail = (s: ServiceDef): string => {
    if (s.id === 'sms') return wallet ? `${wallet.availableUnits.toLocaleString()} units in your wallet` : s.tagline;
    if (s.id === 'data') return fromPrice !== null ? `Bundles from ${formatGhs(fromPrice)}` : s.tagline;
    return s.tagline;
  };

  return (
    <section aria-labelledby="launcher-title">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 id="launcher-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
            What would you like to do today?
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">All your services, one account.</p>
        </div>
        <Link to="/services" className="text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline shrink-0">
          All services →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CUSTOMER_SERVICES.map((s) => {
          const Icon = s.icon;
          const live = s.status === 'live';
          return (
            <Link
              key={s.id}
              to={live ? s.primary.path : s.home}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br p-5 flex flex-col min-h-[168px] transition-all',
                s.accent.gradient,
                live ? cn('hover:shadow-md', s.accent.hoverBorder) : 'opacity-90',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', s.accent.tile)}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </span>
                {!live ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Coming soon
                  </span>
                ) : s.tag ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">{s.tag}</span>
                ) : null}
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">{detail(s)}</p>
              {s.id === 'data' && (
                <div className="flex gap-1 mt-2">
                  {['MTN', 'Telecel', 'AirtelTigo'].map((n) => (
                    <span key={n} className={cn('px-1.5 py-px rounded text-[9px] font-bold', networkStyle(n).chip)}>{n}</span>
                  ))}
                </div>
              )}
              <span className={cn('mt-auto pt-3 inline-flex items-center gap-1 text-xs font-bold', live ? s.accent.text : 'text-slate-500 dark:text-slate-400')}>
                {live ? s.primary.label : 'See what’s coming'}
                {live && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />}
              </span>
            </Link>
          );
        })}

        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 flex flex-col min-h-[168px]">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </span>
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">More on the way</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            We're adding new services to your account. Need something specific?
          </p>
          {supportEmail ? (
            <a href={`mailto:${supportEmail}?subject=Service%20request`} className="mt-auto pt-3 text-xs font-bold text-[#1764e0] dark:text-blue-400 hover:underline">
              Tell us what you need →
            </a>
          ) : (
            <Link to="/services" className="mt-auto pt-3 text-xs font-bold text-[#1764e0] dark:text-blue-400 hover:underline">
              See what's available →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
