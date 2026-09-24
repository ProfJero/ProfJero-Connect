import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { ComposeForm } from '../../components/send-sms/ComposeForm';
import { MessageSummary } from '../../components/send-sms/MessageSummary';

export function SendSmsPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1">
      {/* Breadcrumb + title */}
      <div>
        <nav aria-label="Breadcrumb" className="flex text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <Link to="/dashboard" className="text-[#1a6cf0] dark:text-blue-400 hover:underline">
            Messaging
          </Link>
          <span className="mx-1.5 text-slate-400 dark:text-slate-500">&gt;</span>
          <span className="text-slate-600 dark:text-slate-300">Send SMS</span>
        </nav>

        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400 shrink-0">
            <Send className="w-5 h-5 -rotate-45" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Send SMS
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send SMS messages to your contacts and customers quickly and easily.
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <ComposeForm />
        <MessageSummary />
      </div>
    </main>
  );
}