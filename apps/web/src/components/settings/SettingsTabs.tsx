import { settingsTabs } from '../../mock/settings';
import { cn } from '../../lib/utils';

export function SettingsTabs({ active = 'General' }: { active?: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3"
      data-purpose="settings-subnav"
    >
      {settingsTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.label === active;
        return (
          <button
            key={tab.label}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition',
              isActive
                ? 'bg-[#1976d2] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            )}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}