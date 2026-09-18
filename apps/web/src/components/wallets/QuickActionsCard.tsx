import { Card } from '../ui/Card';
import { quickActions } from '../../mock/wallets';
import { cn } from '../../lib/utils';

export function QuickActionsCard() {
  return (
    <Card className="p-5 flex flex-col" data-purpose="quick-actions-card">
      <h4 className="text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
        Quick Actions
      </h4>
      <div className="mt-3 space-y-2.5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition flex items-center gap-3 group"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform',
                  action.iconBg,
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {action.label}
                </div>
                <div className="text-[10px] text-slate-400">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}