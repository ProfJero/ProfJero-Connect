import { Plus, Minus, Bell, FileText, type LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export type WalletQuickAction = 'credit' | 'debit' | 'threshold' | 'view-history';

interface Action {
  key: WalletQuickAction;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
}

const ACTIONS: Action[] = [
  {
    key: 'credit',
    label: 'Add Units',
    description: 'Credit a project wallet',
    icon: Plus,
    iconBg: 'bg-emerald-500',
  },
  {
    key: 'debit',
    label: 'Deduct Units',
    description: 'Debit a project wallet',
    icon: Minus,
    iconBg: 'bg-rose-500',
  },
  {
    key: 'threshold',
    label: 'Set Low-Balance Threshold',
    description: 'Configure alert threshold per wallet',
    icon: Bell,
    iconBg: 'bg-blue-600',
  },
  {
    key: 'view-history',
    label: 'View Transaction History',
    description: 'Scroll to the full ledger below',
    icon: FileText,
    iconBg: 'bg-purple-700',
  },
];

interface Props {
  onAction: (action: WalletQuickAction) => void;
}

export function QuickActionsCard({ onAction }: Props) {
  return (
    <Card className="p-4" data-purpose="wallet-quick-actions-card">
      <h4 className="text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
        Quick Actions
      </h4>

      <div className="pt-3 space-y-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => onAction(a.key)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors text-left"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-sm',
                  a.iconBg,
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">{a.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{a.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}