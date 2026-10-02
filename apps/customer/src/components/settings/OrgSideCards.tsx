import { Link } from 'react-router-dom';
import { Building2, AtSign, KeyRound, Users, Wallet, ChevronRight, type LucideIcon } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { useWallet } from '../../lib/account';
import type { ContactsResponse, CustomerApiKey, CustomerSenderId } from '../../lib/types';

export function AccountTypeCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Account Type</span>
      <div className="mt-3.5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">Pay as you go</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            One owner login per organisation. Buy units when you need them — no subscription or monthly fee. Team
            seats are on our roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}

/** At-a-glance counts, each linking to where it's managed. */
export function OrgStatCards() {
  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const keys = useApi<{ apiKeys: CustomerApiKey[] }>('/customer/api-keys');
  const contacts = useApi<ContactsResponse>('/customer/contacts?limit=1');
  const { data: wallet } = useWallet();

  const approved = senderIds.data?.senderIds.filter((s) => s.status === 'approved').length;
  const pending = senderIds.data?.senderIds.filter((s) => s.status === 'pending').length ?? 0;
  const activeKeys = keys.data?.apiKeys.filter((k) => k.status === 'active').length;

  const cards: Array<{ label: string; value: string; note: string; to: string; icon: LucideIcon }> = [
    { label: 'Sender IDs', value: approved === undefined ? '—' : String(approved), note: pending ? `${pending} pending` : 'approved', to: '/messaging/sender-ids', icon: AtSign },
    { label: 'API keys', value: activeKeys === undefined ? '—' : String(activeKeys), note: 'active', to: '/api', icon: KeyRound },
    { label: 'Contacts', value: contacts.data ? contacts.data.stats.total.toLocaleString() : '—', note: 'in address book', to: '/contacts', icon: Users },
    { label: 'Wallet', value: wallet ? wallet.availableUnits.toLocaleString() : '—', note: 'units available', to: '/wallet', icon: Wallet },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.label}</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{c.value}</div>
                <div className="text-[10px] text-slate-400 truncate">{c.note}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
          </Link>
        );
      })}
    </section>
  );
}
