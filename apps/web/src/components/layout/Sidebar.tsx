import { Link, NavLink } from 'react-router-dom';
import {
  Send,
  Plus,
  CreditCard,
  Database,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { navItems } from '../../lib/nav';
import { useAdminData } from '../../lib/adminData';
import { useAuth } from '../../lib/auth';
import { timeAgo } from '../../lib/datetime';
import { BrandMark } from '../brand/BrandMark';

function QuickAction({
  icon: Icon,
  label,
  variant = 'secondary',
  to,
}: {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary';
  to: string;
}) {
  const className = cn(
    'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
    variant === 'primary'
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-900/30'
      : 'bg-[#142646] hover:bg-[#1a315a] text-slate-200 border border-slate-700/60',
  );

  const content = (
    <>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </>
  );

  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
}

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin' || user?.role === 'admin';
  const canBill = canManage || user?.role === 'finance';
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'w-[260px] bg-[#0c1e38] text-slate-300 flex flex-col justify-between shrink-0 h-screen overflow-y-auto custom-scrollbar',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        data-purpose="main-sidebar"
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-8">
            <BrandMark className="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-[17px] leading-tight tracking-tight">
                ProfJero Connect
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                One Platform. Multiple Projects.
              </p>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Sidebar Navigation" className="space-y-1">
            {navItems.filter((n) => !n.roles || (user && n.roles.includes(user.role))).map(({ label, icon: Icon, path }) => (
              <NavLink
                key={label}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-[13.5px] transition-colors',
                    isActive
                      ? 'bg-[#1976d2] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3 px-1">
              Quick Actions
            </span>
            <div className="space-y-2">
              <QuickAction icon={Send} label="Send SMS" variant="primary" to="/send-sms" />
              {canManage && <QuickAction icon={Plus} label="Add Project" to="/projects?new=1" />}
              {canBill && <QuickAction icon={CreditCard} label="Create Payment Link" to="/payments?new=1" />}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <ProviderBalance onNavigate={onClose} />
          <div className="px-1 text-[11px] text-slate-400 leading-snug">
            <div>ProfJero Connect admin</div>
            <div>© {new Date().getFullYear()} ProfJero Digital Studio</div>
          </div>
        </div>
      </aside>
    </>
  );
}
/**
 * Live SMS provider balance (credits on the upstream account), refreshed
 * by the 15-minute cron and on demand from the provider page. The status
 * dot reflects the provider record, not a hardcoded "Connected".
 */
function ProviderBalance({ onNavigate }: { onNavigate?: () => void }) {
  const { smsProvider: p, providersLoading } = useAdminData();
  const status =
    !p ? { label: providersLoading ? 'Loading…' : 'Not set up', dot: 'bg-slate-500', text: 'text-slate-400' }
    : p.status === 'active' ? { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-400' }
    : p.status === 'error' ? { label: 'Error', dot: 'bg-rose-500', text: 'text-rose-400' }
    : { label: 'Inactive', dot: 'bg-amber-500', text: 'text-amber-400' };

  return (
    <Link
      to={p ? `/providers/${p.id}` : '/providers'}
      onClick={onNavigate}
      className="bg-[#122646] border border-slate-700/60 rounded-xl p-3 flex items-center gap-3 hover:border-slate-500/70 transition-colors"
      title="SMS provider balance"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
        <Database className="w-5 h-5" />
      </div>
      <div className="overflow-hidden">
        <div className="text-[11px] text-slate-400 font-medium">SMS Provider Balance</div>
        <div className="text-white font-bold text-sm tracking-wide">
          {p?.credits != null ? p.credits.toLocaleString() : '—'}{' '}
          <span className="text-[11px] font-normal text-slate-300">credits</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn('w-2 h-2 rounded-full', status.dot)} />
          <span className={cn('text-[10px] font-medium', status.text)}>{status.label}</span>
          {p?.balanceCheckedAt && <span className="text-[10px] text-slate-500 truncate">· {timeAgo(p.balanceCheckedAt)}</span>}
        </div>
      </div>
    </Link>
  );
}
