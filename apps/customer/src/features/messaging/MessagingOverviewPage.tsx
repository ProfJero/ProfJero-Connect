import { Link } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';
import { MessagingStatCard } from '../../components/messaging/MessagingStatCard';
import { MessagingFilterBar } from '../../components/messaging/MessagingFilterBar';
import { RecentMessagesTable } from '../../components/messaging/RecentMessagesTable';
import { messagingStats } from '../../mock/messaging';

export function MessagingOverviewPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      {/* Page header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <MessageSquare className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Messaging
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send messages and manage your SMS activity.
            </p>
          </div>
        </div>

        <Link
          to="/messaging/sms"
          className="inline-flex items-center justify-center gap-2 bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
          <span>Send SMS</span>
        </Link>
      </section>

      {/* Sub tabs */}
      <MessagingTabs />

      {/* Overview stats */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">SMS Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {messagingStats.map((stat) => (
            <MessagingStatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </section>

      {/* Filters */}
      <MessagingFilterBar />

      {/* Table */}
      <RecentMessagesTable />
    </main>
  );
}