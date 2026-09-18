import { Zap, Pencil, Plus, Send, KeyRound, Ban } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

const ACTIONS = [
  { label: 'Edit Project', icon: Pencil, tone: 'neutral' as const },
  { label: 'Add Units', icon: Plus, tone: 'neutral' as const },
  { label: 'Send SMS', icon: Send, tone: 'neutral' as const, rotate: true },
  { label: 'Regenerate API Key', icon: KeyRound, tone: 'neutral' as const },
  { label: 'Suspend Project', icon: Ban, tone: 'danger' as const },
];

export function ProjectQuickActionsCard() {
  return (
    <Card className="p-4 lg:col-span-4">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
        <Zap className="w-4 h-4 text-blue-600 fill-current" strokeWidth={0} />
        <h4 className="font-bold text-slate-900 text-sm">Quick Actions</h4>
      </div>

      <div className="mt-3 space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isDanger = action.tone === 'danger';
          return (
            <button
              key={action.label}
              className={cn(
                'w-full border text-xs font-medium py-2 px-3 rounded-lg flex items-center gap-2.5 transition-colors shadow-xs',
                isDanger
                  ? 'bg-white hover:bg-red-50 border-red-200 text-red-600'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700',
              )}
            >
              <Icon
                className={cn(
                  'w-3.5 h-3.5',
                  isDanger ? 'text-red-500' : 'text-blue-600',
                  action.rotate && '-rotate-45',
                )}
                strokeWidth={2}
              />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}