import { Bell, Info } from 'lucide-react';
import { notifications, type NotificationCategory } from '../../mock/notifications';

const CATEGORIES: Array<{ id: NotificationCategory; label: string; dot: string }> = [
  { id: 'account', label: 'Account', dot: 'bg-purple-500' },
  { id: 'sms', label: 'SMS', dot: 'bg-emerald-500' },
  { id: 'payments', label: 'Payments', dot: 'bg-amber-500' },
  { id: 'sender-ids', label: 'Sender IDs', dot: 'bg-teal-500' },
  { id: 'system', label: 'System', dot: 'bg-rose-500' },
];

export function NotificationSummary() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Notification Summary
          </h3>
        </div>

        <div className="space-y-3.5 text-xs font-medium">
          <Row
            label="Unread"
            dot="bg-[#1a6cf0]"
            count={unreadCount}
            countBg="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          />
          {CATEGORIES.map((cat) => {
            const count = notifications.filter((n) => n.category === cat.id).length;
            return (
              <Row
                key={cat.id}
                label={cat.label}
                dot={cat.dot}
                count={count}
                countBg="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              />
            );
          })}
        </div>
      </div>

      {/* Info callout */}
      <div className="bg-sky-50/70 dark:bg-blue-500/10 border border-sky-100/90 dark:border-blue-500/20 rounded-2xl p-5 flex items-start gap-3.5">
        <div className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
            Stay informed
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Enable notifications to never miss important updates about your account,
            services and transactions.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  dot,
  count,
  countBg,
}: {
  label: string;
  dot: string;
  count: number;
  countBg: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
      </div>
      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${countBg}`}>
        {count}
      </span>
    </div>
  );
}