import {
  FolderKanban,
  FolderCheck,
  Send,
  XCircle,
  HelpCircle,
  Wallet,
  Lock,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type StatIcon =
  | 'projects'
  | 'active'
  | 'send'
  | 'failed'
  | 'unknown'
  | 'wallet'
  | 'lock'
  | 'package';

export interface Stat {
  title: string;
  subtitle?: string;
  value: string;
  icon: StatIcon;
  iconBg: string;
  footnote?: string;
}

const ICON_MAP: Record<StatIcon, LucideIcon> = {
  projects: FolderKanban,
  active: FolderCheck,
  send: Send,
  failed: XCircle,
  unknown: HelpCircle,
  wallet: Wallet,
  lock: Lock,
  package: Package,
};

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = ICON_MAP[stat.icon];
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0',
            stat.iconBg,
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-500 font-medium">
            {stat.title}
            {stat.subtitle && (
              <span className="text-slate-500 ml-1">{stat.subtitle}</span>
            )}
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 tracking-tight">
            {stat.value}
          </div>
          {stat.footnote && (
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stat.footnote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}