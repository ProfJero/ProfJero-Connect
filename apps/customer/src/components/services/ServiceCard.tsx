import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Check } from 'lucide-react';
import type { ServiceCardData } from '../../lib/servicesContent';
import { cn } from '../../lib/utils';

const TELCOS = [
  { label: 'MTN', bg: 'bg-amber-400 text-slate-900' },
  { label: 'vodafone', bg: 'bg-red-600 text-white' },
  { label: 'airteltigo', bg: 'bg-red-100 text-red-700' },
];

export function ServiceCard({ service }: { service: ServiceCardData }) {
  const Icon = service.icon;
  const isAvailable = service.status === 'Available';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all">
      <div>
        <div className={cn('flex items-start justify-between mb-4', !isAvailable && 'justify-between')}>
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              service.iconBg,
              service.iconColor,
            )}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
          {!isAvailable && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Coming Soon
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {service.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="mt-6 pt-2">
        {isAvailable && service.ctaPath ? (
          <Link
            to={service.ctaPath}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-blue-500 text-[#1a6cf0] dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
          >
            <span>{service.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed"
          >
            <Bell className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{service.ctaLabel}</span>
          </button>
        )}

        {service.telcos && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            {TELCOS.map((t) => (
              <span
                key={t.label}
                className={cn('px-1.5 py-0.5 rounded font-bold text-[10px]', t.bg)}
              >
                {t.label}
              </span>
            ))}
            <span className="text-[10px] text-slate-400 dark:text-slate-500">+ more</span>
          </div>
        )}

        {service.tags && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-medium">
            {service.tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  'inline-flex items-center gap-1',
                  tag.tone === 'blue'
                    ? 'text-[#1a6cf0] dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <Check
                  className={cn(
                    'w-3 h-3',
                    tag.tone === 'blue' ? 'text-[#1a6cf0] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500',
                  )}
                  strokeWidth={2.5}
                />
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}