import { Send, HelpCircle } from 'lucide-react';
import { WizardBar } from '../../components/send-sms/WizardBar';
import { ComposeForm } from '../../components/send-sms/ComposeForm';
import { SendSmsSidebar } from '../../components/send-sms/SendSmsSidebar';

export function SendSmsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Send className="w-5 h-5 -rotate-45" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Send SMS
            </h1>
            <p className="text-xs text-slate-500">
              Send SMS messages to your recipients quickly and easily.
            </p>
          </div>
        </div>

        {/* Need help widget */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2} />
          <div className="text-xs text-slate-600 min-w-0">
            <span className="font-semibold text-slate-800">Need help?</span>{' '}
            <span>
              Check our{' '}
              <a className="text-blue-600 hover:underline" href="#">
                SMS guide
              </a>{' '}
              or contact support for assistance.
            </span>
          </div>
          <a
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 hidden sm:block"
            href="#"
          >
            View Guide →
          </a>
        </div>
      </div>

      {/* Wizard */}
      <WizardBar currentStep={1} />

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
        <ComposeForm />
        <SendSmsSidebar />
      </div>
    </main>
  );
}