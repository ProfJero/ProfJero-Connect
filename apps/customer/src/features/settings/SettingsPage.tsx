import { Settings as SettingsIcon } from 'lucide-react';
import { SettingsNav } from '../../components/settings/SettingsNav';
import {
  ProfileCard,
  OrganisationCard,
  SecurityCard,
  NotificationsCard,
  BillingCard,
  ApiSettingsCard,
} from '../../components/settings/SettingsCards';

export function SettingsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#1a6cf0] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <SettingsIcon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Manage your account, organisation and preferences.
          </p>
        </div>
      </div>

      {/* Nav + cards */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <SettingsNav />

        <div className="flex-1 w-full space-y-6">
          {/* Row 1: Profile + Organisation */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ProfileCard />
            <OrganisationCard />
          </div>

          {/* Row 2: Security + Notifications */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SecurityCard />
            <NotificationsCard />
          </div>

          {/* Row 3: Billing + API */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BillingCard />
            <ApiSettingsCard />
          </div>
        </div>
      </div>
    </main>
  );
}