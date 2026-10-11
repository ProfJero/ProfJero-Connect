import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, User, Building2, Lock, Bell, Wallet, Code2, Pencil, type LucideIcon } from 'lucide-react';
import {
  ProfileCard,
  SecurityCard,
  NotificationsCard,
  BillingCard,
  ApiSettingsCard,
} from '../../components/settings/SettingsCards';
import { OrgIdentityBanner } from '../../components/settings/OrgIdentityBanner';
import { OrgInfoCard } from '../../components/settings/OrgInfoCard';
import { AccountTypeCard, OrgStatCards } from '../../components/settings/OrgSideCards';
import { cn } from '../../lib/utils';

type TabId = 'profile' | 'organisation' | 'security' | 'notifications' | 'billing' | 'api';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon; description: string }> = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Your name and contact details.' },
  { id: 'organisation', label: 'Organisation', icon: Building2, description: 'The business you send messages for.' },
  { id: 'security', label: 'Security', icon: Lock, description: 'Password and sign-in.' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'How we keep you informed.' },
  { id: 'billing', label: 'Billing', icon: Wallet, description: 'Pay as you go — no subscription.' },
  { id: 'api', label: 'API', icon: Code2, description: 'Connect your own systems.' },
];

/**
 * Settings, one section at a time. The active tab lives in the URL
 * (?tab=security) so links, refresh and Back all land on the same section.
 */
export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'profile';
  const active = TABS.find((t) => t.id === tab)!;

  const select = (id: TabId) => {
    setParams(id === 'profile' ? {} : { tab: id });
    // Bring the section into view on small screens, where tabs sit above it.
    document.getElementById('settings-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#1764e0] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <SettingsIcon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Manage your account, organisation and preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <nav
          aria-label="Settings sections"
          className="w-full lg:w-52 shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-xs flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-20"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                title={t.description}
                onClick={() => select(t.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition whitespace-nowrap lg:w-full',
                  on
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-[#1764e0] dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', on ? 'text-[#1764e0] dark:text-blue-400' : 'text-slate-500')} strokeWidth={2} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Each card carries its own heading, so the panel only needs a label. */}
        <section id="settings-panel" aria-label={active.label} className="flex-1 w-full min-w-0 space-y-4 scroll-mt-20">
          {/* key: each visit to a tab starts fresh */}
          <div key={tab} className="max-w-3xl">
            {tab === 'profile' && <ProfileCard />}
            {tab === 'organisation' && <OrganisationPanel />}
            {tab === 'security' && <SecurityCard />}
            {tab === 'notifications' && <NotificationsCard />}
            {tab === 'billing' && <BillingCard />}
            {tab === 'api' && <ApiSettingsCard />}
          </div>
        </section>
      </div>
    </main>
  );
}

/** Organisation details as entered at sign-up, editable in place. */
function OrganisationPanel() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={editing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1764e0] hover:bg-[#155cd0] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
          {editing ? 'Editing…' : 'Edit details'}
        </button>
      </div>
      <OrgIdentityBanner />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <OrgInfoCard editing={editing} onDone={() => setEditing(false)} />
        <div className="xl:col-span-5">
          <AccountTypeCard />
        </div>
      </div>
      <OrgStatCards />
    </div>
  );
}
