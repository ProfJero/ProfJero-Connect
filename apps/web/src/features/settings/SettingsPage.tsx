import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsTabs } from '../../components/settings/SettingsTabs';
import { PlatformInfoCard } from '../../components/settings/PlatformInfoCard';
import { DefaultSettingsCard } from '../../components/settings/DefaultSettingsCard';
import { PlatformOverviewSide } from '../../components/settings/PlatformOverviewSide';
import { QuickActionsCard } from '../../components/settings/QuickActionsCard';
import { PlatformPromoCard } from '../../components/settings/PlatformPromoCard';
import { RecentActivityCard } from '../../components/settings/RecentActivityCard';

export function SettingsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Page title */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
          <SettingsIcon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Manage your platform configuration, preferences and system settings.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <SettingsTabs active="General" />

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PlatformInfoCard />
        <DefaultSettingsCard />
        <PlatformOverviewSide />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <QuickActionsCard />
        <PlatformPromoCard />
        <RecentActivityCard />
      </div>
    </main>
  );
}