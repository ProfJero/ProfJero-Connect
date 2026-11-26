import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAdminData } from '../../lib/adminData';
import { timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

const ICON = { error: AlertCircle, warning: AlertTriangle, info: Info } as const;
const TONE = {
  error: 'bg-rose-50 text-rose-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-600',
} as const;

/**
 * Topbar bell: live operational alerts computed by GET /admin/alerts.
 * Opening the panel marks everything currently shown as seen.
 */
export function AlertsBell() {
  const { alerts, unreadCount, alertsLoading, alertsError, markAlertsSeen, refreshAlerts } = useAdminData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) void markAlertsSeen();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Alerts (${unreadCount} new)` : 'Alerts'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Alerts"
            className="absolute right-0 top-full mt-2 w-[min(92vw,380px)] bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Alerts</h3>
                <p className="text-[11px] text-slate-500">Things that need an operator. They clear when resolved.</p>
              </div>
              <button type="button" onClick={refreshAlerts} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Refresh alerts">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {alertsLoading ? (
                <p className="px-4 py-6 text-xs text-slate-500">Loading…</p>
              ) : alertsError ? (
                <p className="px-4 py-6 text-xs text-rose-600">Couldn't load alerts: {alertsError.message}</p>
              ) : alerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 mt-2">All clear</p>
                  <p className="text-[11px] text-slate-500">No pending requests, low balances or stuck messages.</p>
                </div>
              ) : (
                alerts.map((a) => {
                  const Icon = ICON[a.severity];
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(a.link);
                      }}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50"
                    >
                      <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', TONE[a.severity])}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-xs text-slate-900', a.unread ? 'font-bold' : 'font-semibold')}>
                          {a.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">{a.body}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{timeAgo(a.latestAt)}</span>
                      </span>
                      {a.unread && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" aria-label="New" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
