import { useState } from 'react';
import { UserPlus, Smartphone, Upload, type LucideIcon } from 'lucide-react';
import { recipientTabs, type RecipientTab } from '../../mock/sendSms';
import { cn } from '../../lib/utils';

const ICONS: Record<RecipientTab['id'], LucideIcon> = {
  contacts: UserPlus,
  manual: Smartphone,
  upload: Upload,
};

export function RecipientTabs() {
  const [active, setActive] = useState<RecipientTab['id']>('contacts');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      {recipientTabs.map((tab) => {
        const Icon = ICONS[tab.id];
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'rounded-lg p-3 text-left shadow-xs flex items-start gap-2.5 transition-colors border',
              isActive
                ? 'border-[#1a6cf0] bg-[#1a6cf0] text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
            )}
          >
            <Icon
              className={cn('w-4 h-4 mt-0.5 shrink-0', !isActive && 'text-slate-400 dark:text-slate-500')}
              strokeWidth={2}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-none">{tab.title}</div>
              <div
                className={cn(
                  'text-[10px] mt-1',
                  isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500',
                )}
              >
                {tab.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}