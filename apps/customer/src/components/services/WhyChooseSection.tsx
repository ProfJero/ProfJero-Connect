import { whyChoose } from '../../mock/services';
import { cn } from '../../lib/utils';

export function WhyChooseSection() {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Why Choose ProfJero Connect?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          More than just messaging. It's your complete communication and connectivity
          platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {whyChoose.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  item.iconBg,
                  item.iconColor,
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}