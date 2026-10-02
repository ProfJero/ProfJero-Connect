import { Link } from 'react-router-dom';
import { ChevronRight, Mail, Smartphone, Phone, Code2, type LucideIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useWallet } from '../../lib/account';
import { cn } from '../../lib/utils';

export function ServiceOverview({ activeKeys }: { activeKeys: number | null }) {
  const { data: wallet } = useWallet();
  const items: Array<{ name: string; description: string; to: string; available: boolean; icon: LucideIcon; iconBg: string; iconColor: string }> = [
    {
      name: 'SMS',
      description: wallet ? `${wallet.availableUnits.toLocaleString()} units available` : 'Bulk and single messages',
      to: '/messaging/sms',
      available: true,
      icon: Mail,
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-[#1a6cf0] dark:text-blue-400',
    },
    {
      name: 'API',
      description: activeKeys === null ? 'Connect your systems' : `${activeKeys} active key${activeKeys === 1 ? '' : 's'}`,
      to: '/api',
      available: true,
      icon: Code2,
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      name: 'Data',
      description: 'Data bundles',
      to: '/services/data',
      available: false,
      icon: Smartphone,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'Airtime',
      description: 'Airtime top-ups',
      to: '/services/airtime',
      available: false,
      icon: Phone,
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Services</h3>
        <Link to="/services" className="text-[#1a6cf0] dark:text-blue-400 hover:underline text-xs font-medium">
          View all →
        </Link>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.to}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.iconBg, item.iconColor)}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={item.available ? 'success' : 'neutral'} label={item.available ? 'Available' : 'Coming soon'} />
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={2} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
