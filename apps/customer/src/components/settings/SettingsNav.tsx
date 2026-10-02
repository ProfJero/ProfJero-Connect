import { Link, useLocation } from 'react-router-dom';
import { User, Building2, Lock, Bell, Wallet, Code2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const settingsNavItems = [
  { id: 'profile', label: 'Profile', icon: User, path: '/settings' },
  { id: 'organisation', label: 'Organisation', icon: Building2, path: '/settings/organisation' },
  { id: 'security', label: 'Security', icon: Lock, path: '/settings#security' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/settings#notifications' },
  { id: 'billing', label: 'Billing', icon: Wallet, path: '/settings#billing' },
  { id: 'api', label: 'API', icon: Code2, path: '/settings#api' },
];

export function SettingsNav() {
  const { pathname, hash } = useLocation();

  return (
    <div className="w-full lg:w-48 shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
      {settingsNavItems.map((item) => {
        const Icon = item.icon;
        // Active if path matches exactly and no hash
        const [itemPath, itemHash] = item.path.split('#');
        const isActive =
          pathname === itemPath && (itemHash ? hash === `#${itemHash}` : !hash);

        return (
          <Link
            key={item.id}
            to={item.path}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition',
              isActive
                ? 'bg-blue-50 dark:bg-blue-500/10 text-[#1764e0] dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium',
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 shrink-0',
                isActive ? 'text-[#1764e0] dark:text-blue-400' : 'text-slate-500 dark:text-slate-500',
              )}
              strokeWidth={2}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}