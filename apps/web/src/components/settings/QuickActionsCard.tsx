import { Zap, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { quickActionLinks } from '../../mock/settings';

export function QuickActionsCard() {
  return (
    <Card
      className="p-6 lg:col-span-4 flex flex-col justify-between"
      data-purpose="quick-actions-card"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-blue-600 fill-current" strokeWidth={0} />
          <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Common platform tasks you can perform.</p>

        <div className="space-y-2.5">
          {quickActionLinks.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition group"
                href="#"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1976d2] text-white flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600">
                      {action.label}
                    </h4>
                    <p className="text-[10.5px] text-slate-400">{action.description}</p>
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </a>
            );
          })}
        </div>
      </div>
    </Card>
  );
}