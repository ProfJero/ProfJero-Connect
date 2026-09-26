import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Building2,
  Lock,
  Bell,
  CreditCard,
  Code2,
  Save,
  ChevronRight,
  Camera,
  Phone,
  Mail,
  RefreshCw,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import {
  profileData,
  organisationData,
  businessTypeOptions,
  securityItems,
  notificationToggles,
  billingData,
  apiData,
} from '../../mock/settings';
import { cn } from '../../lib/utils';

/* ---------- Shared primitives ---------- */

function CardShell({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
  id,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between scroll-mt-24"
    >
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
      {footer && <div className="mt-5 flex justify-end">{footer}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
      {children}
    </label>
  );
}

function TextInput({
  type = 'text',
  defaultValue,
  placeholder,
  className = '',
  hasIcon,
}: {
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  hasIcon?: boolean;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={cn(
        'w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0]',
        hasIcon ? 'pl-8 pr-3' : 'px-3',
        className,
      )}
    />
  );
}

function SaveButton() {
  return (
    <button className="bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition">
      <Save className="w-3.5 h-3.5 rotate-180" strokeWidth={2} />
      Save Changes
    </button>
  );
}

function Toggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className={cn(
        'relative inline-flex items-center rounded-full w-9 h-5 shrink-0 transition-colors',
        on ? 'bg-[#1a6cf0]' : 'bg-slate-200 dark:bg-slate-700',
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          'w-4 h-4 bg-white rounded-full shadow transform transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/* ---------- Cards ---------- */

export function ProfileCard() {
  return (
    <CardShell
      icon={User}
      title="Profile"
      subtitle="Your personal information and profile details."
      footer={<SaveButton />}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 self-center sm:self-start">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl ring-2 ring-slate-100 dark:ring-slate-800">
              {profileData.initials}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center hover:bg-slate-700 shadow border-2 border-white dark:border-slate-900 transition">
              <Camera className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
          <button className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-[#1a6cf0] dark:text-blue-400 transition shadow-xs">
            Change Photo
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 w-full space-y-3">
          <div>
            <FieldLabel>Full Name</FieldLabel>
            <TextInput defaultValue={profileData.fullName} />
          </div>
          <div>
            <FieldLabel>Email Address</FieldLabel>
            <TextInput type="email" defaultValue={profileData.email} />
          </div>
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <TextInput type="tel" defaultValue={profileData.phone} />
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export function OrganisationCard() {
  return (
    <CardShell
      icon={Building2}
      title="Organisation"
      subtitle="Manage your business or organisation details."
      footer={
        <div className="flex items-center gap-2">
          <Link
            to="/settings/organisation"
            className="text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:underline px-2"
          >
            View full profile →
          </Link>
          <SaveButton />
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Organisation Name</FieldLabel>
            <TextInput defaultValue={organisationData.name} />
          </div>
          <div>
            <FieldLabel>Business Type</FieldLabel>
            <select
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0]"
              defaultValue={organisationData.businessType}
            >
              {businessTypeOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <FieldLabel>Address</FieldLabel>
          <textarea
            rows={2}
            defaultValue={organisationData.address}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] resize-none"
          />
        </div>
        <div>
          <FieldLabel>Contact Information</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <TextInput type="tel" defaultValue={organisationData.phone} hasIcon />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <TextInput type="email" defaultValue={organisationData.email} hasIcon />
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export function SecurityCard() {
  return (
    <CardShell
      icon={Lock}
      title="Security"
      subtitle="Keep your account secure and manage your access."
      id="security"
    >
      <div className="space-y-2.5">
        {securityItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  item.comingSoon
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400',
                )}
              >
                {item.id === 'password' && <RefreshCw className="w-4 h-4" strokeWidth={2} />}
                {item.id === 'sessions' && <ShieldCheck className="w-4 h-4" strokeWidth={2} />}
                {item.id === 'two-factor' && <Lock className="w-4 h-4" strokeWidth={2} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {item.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.comingSoon && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Coming Soon
                </span>
              )}
              <ChevronRight
                className="w-4 h-4 text-slate-400 dark:text-slate-500"
                strokeWidth={2}
              />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function NotificationsCard() {
  return (
    <CardShell
      icon={Bell}
      title="Notifications"
      subtitle="Choose what notifications you want to receive."
      id="notifications"
    >
      <div className="space-y-4">
        {notificationToggles.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {t.label}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.description}
              </div>
            </div>
            <Toggle defaultOn={t.enabled} />
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export function BillingCard() {
  return (
    <CardShell
      icon={CreditCard}
      title="Billing"
      subtitle="Manage your billing information and payment methods."
      id="billing"
      footer={
        <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition">
          Manage Billing
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1.5">
            Payment Method
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {billingData.paymentMethod}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {billingData.status}
            </span>
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mb-1.5">
            Next Billing Date
          </span>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {billingData.nextBillingDate}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                {billingData.billingCycle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export function ApiSettingsCard() {
  return (
    <CardShell
      icon={Code2}
      title="API"
      subtitle="Manage your API keys and integrations."
      id="api"
      footer={
        <Link
          to="/api"
          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
        >
          Manage API Keys
        </Link>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              API Access
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {apiData.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{apiData.description}</p>
        </div>
      </div>
    </CardShell>
  );
}