import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Building2,
  MessageSquare,
  CreditCard,
  Bell,
  Shield,
  Users,
  ScrollText,
  Activity,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { useSettings } from '../../components/settings/useSettings';
import {
  GeneralSection,
  NotificationsSection,
  PaymentsSection,
  SecuritySection,
  SmsSection,
} from '../../components/settings/ConfigSections';
import { TeamSection } from '../../components/settings/TeamSection';
import { AuditSection } from '../../components/settings/AuditSection';
import { SystemSection } from '../../components/settings/SystemSection';
import { ProfileSection } from '../../components/settings/ProfileSection';

type TabId = 'general' | 'sms' | 'payments' | 'notifications' | 'security' | 'team' | 'audit' | 'system' | 'profile';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon; roles?: string[] }> = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'team', label: 'Team / Admin Users', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: ScrollText, roles: ['super_admin', 'admin'] },
  { id: 'system', label: 'System', icon: Activity },
  { id: 'profile', label: 'My Profile', icon: UserRound },
];

export function SettingsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.roles || (user && t.roles.includes(user.role)));
  const requested = params.get('tab') as TabId | null;
  const tab = tabs.find((t) => t.id === requested)?.id ?? 'general';
  const settings = useSettings();
  const s = settings.data;

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
          <SettingsIcon className="w-6 h-6" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">Settings</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Platform configuration, team access, audit trail and system health.
          </p>
        </div>
      </div>

      <nav aria-label="Settings sections" className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap',
                active ? 'bg-[#1976d2] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {['general', 'sms', 'payments', 'notifications', 'security'].includes(tab) &&
        (settings.loading && !s ? (
          <p className="text-xs text-slate-500">Loading settings…</p>
        ) : settings.error || !s ? (
          <p role="alert" className="text-xs text-rose-600">Couldn't load settings: {settings.error?.message}</p>
        ) : (
          <div className="max-w-3xl">
            {tab === 'general' && (
              <GeneralSection value={s.settings.general} canEdit={s.canEdit.general} saving={settings.saving === 'general'} updated={s.meta.general.updatedAt} onSave={(v) => settings.save('general', v)} />
            )}
            {tab === 'sms' && (
              <SmsSection value={s.settings.sms} canEdit={s.canEdit.sms} saving={settings.saving === 'sms'} updated={s.meta.sms.updatedAt} onSave={(v) => settings.save('sms', v)} />
            )}
            {tab === 'payments' && (
              <PaymentsSection value={s.settings.payments} canEdit={s.canEdit.payments} saving={settings.saving === 'payments'} updated={s.meta.payments.updatedAt} onSave={(v) => settings.save('payments', v)} />
            )}
            {tab === 'notifications' && (
              <NotificationsSection value={s.settings.notifications} canEdit={s.canEdit.notifications} saving={settings.saving === 'notifications'} updated={s.meta.notifications.updatedAt} onSave={(v) => settings.save('notifications', v)} />
            )}
            {tab === 'security' && (
              <SecuritySection value={s.settings.security} canEdit={s.canEdit.security} saving={settings.saving === 'security'} updated={s.meta.security.updatedAt} onSave={(v) => settings.save('security', v)} />
            )}
          </div>
        ))}

      {tab === 'team' && <TeamSection />}
      {tab === 'audit' && <AuditSection />}
      {tab === 'system' && <SystemSection />}
      {tab === 'profile' && <ProfileSection />}
    </main>
  );
}
