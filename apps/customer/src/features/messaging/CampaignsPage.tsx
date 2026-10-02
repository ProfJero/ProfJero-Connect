import { Megaphone } from 'lucide-react';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';

export function CampaignsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <section className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <MessageSquareIcon />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Messaging
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Send messages and manage your SMS activity.
          </p>
        </div>
      </section>

      <MessagingTabs />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1764e0] dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-6 h-6" strokeWidth={2} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Campaigns coming soon
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          Schedule sends, target groups and track campaign performance. We'll enable
          this once the underlying send infrastructure is fully wired.
        </p>
      </div>
    </main>
  );
}

// Inline icon to avoid re-importing MessageSquare
function MessageSquareIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}