import { Link, NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  CreditCard,
  Database,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { navItems } from '../../lib/nav';

function QuickAction({
  icon: Icon,
  label,
  variant = 'secondary',
  to,
}: {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary';
  to?: string;
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

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button className={className}>{content}</button>
  );
}

export function Sidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
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
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-[17px] leading-tight tracking-tight">
                ProfJero SMS
              </h1>
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
            {navItems.map(({ label, icon: Icon, path }) => (
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
              <QuickAction icon={Plus} label="Add Project" />
              <QuickAction icon={CreditCard} label="Buy SMS Units" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-[#122646] border border-slate-700/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] text-slate-400 font-medium">Arkesel Balance</div>
              <div className="text-white font-bold text-sm tracking-wide">
                12,000{' '}
                <span className="text-[11px] font-normal text-slate-300">SMS Credits</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
              </div>
            </div>
          </div>
          <div className="px-1 text-[11px] text-slate-400 leading-snug">
            <div>ProfJero SMS v1.0.0</div>
            <div>© 2025 ProfJero Technologies</div>
          </div>
        </div>
      </aside>
    </>
  );
}