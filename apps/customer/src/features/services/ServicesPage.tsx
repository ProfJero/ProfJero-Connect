import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, LayoutGrid, Wifi } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { WhyChooseSection } from '../../components/services/WhyChooseSection';
import { CUSTOMER_SERVICES, SERVICES, networkStyle, type ServiceDef } from '../../lib/services';
import { useApi } from '../../lib/useApi';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { DataCatalog } from '../../lib/types';

export function ServicesPage() {
  const catalog = useApi<DataCatalog>('/customer/data/bundles');
  const bundles = catalog.data?.bundles ?? [];
  const fromPrice = bundles.length ? Math.min(...bundles.map((b) => b.sellPriceGhs)) : null;
  const developer = SERVICES.filter((s) => s.kind === 'developer');
  const live = CUSTOMER_SERVICES.filter((s) => s.status === 'live').length;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        icon={LayoutGrid}
        title="Services"
        subtitle={`${live} services live on your account, with more on the way. Pay only for what you use.`}
      />

      {/* Spotlight: the newest service */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-700 to-teal-800 text-white p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider">
              <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} /> New · Data bundles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Data for any number, in seconds.</h2>
            <p className="text-sm text-emerald-50/90 max-w-xl">
              Keep your team, customers and family online. Choose a bundle, pay with mobile money or card, and we
              send it straight to the number. If it can't be delivered, you get every pesewa back.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/services/data" className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-sm px-5 py-2.5 rounded-lg shadow-md transition">
                Buy data now <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              {fromPrice !== null && <span className="text-sm font-semibold text-emerald-50">Bundles from {formatGhs(fromPrice)}</span>}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-3 gap-2.5">
              {['MTN', 'Telecel', 'AirtelTigo'].map((n) => {
                const count = bundles.filter((b) => b.networkKey === n).length;
                return (
                  <Link
                    key={n}
                    to={`/services/data?network=${n}`}
                    className="rounded-xl bg-white/95 dark:bg-slate-900/90 p-3 text-center hover:scale-[1.02] transition-transform"
                  >
                    <span className={cn('inline-block px-2 py-0.5 rounded text-[11px] font-extrabold', networkStyle(n).chip)}>{n}</span>
                    <span className="block mt-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {catalog.data ? (count > 0 ? `${count} bundle${count === 1 ? '' : 's'}` : 'Soon') : '…'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="all-services">
        <h2 id="all-services" className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">All services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {CUSTOMER_SERVICES.map((s) => (
            <ServiceTile key={s.id} service={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="dev-services">
        <h2 id="dev-services" className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">For developers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {developer.map((s) => (
            <ServiceTile key={s.id} service={s} />
          ))}
        </div>
      </section>

      <WhyChooseSection />
    </main>
  );
}

function ServiceTile({ service: s }: { service: ServiceDef }) {
  const Icon = s.icon;
  const live = s.status === 'live';
  return (
    <article className={cn('bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col transition-all', live && cn('hover:shadow-md', s.accent.hoverBorder))}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', s.accent.tile)}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </span>
        {live ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {s.tag ?? 'Available'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Clock className="w-3 h-3" strokeWidth={2.5} /> Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{s.description}</p>
      <ul className="mt-4 space-y-1.5">
        {s.highlights.map((h) => (
          <li key={h} className="flex items-center gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <Check className={cn('w-3.5 h-3.5 shrink-0', live ? s.accent.text : 'text-slate-400')} strokeWidth={2.5} />
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5 flex flex-wrap gap-2">
        {live ? (
          <>
            <Link to={s.primary.path} className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors', s.accent.solid)}>
              {s.primary.label} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
            {s.pages.filter((p) => p.path !== s.primary.path).slice(0, 1).map((p) => (
              <Link key={p.path} to={p.path} className="inline-flex items-center text-xs font-semibold px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                {p.label}
              </Link>
            ))}
          </>
        ) : (
          <Link to={s.home} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            See what's coming
          </Link>
        )}
      </div>
    </article>
  );
}
