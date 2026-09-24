import {
  Package,
  Users,
  MessageSquare,
  ChevronDown,
  Search,
  Clock,
  Info,
  Check,
} from 'lucide-react';
import { RecipientTabs } from './RecipientTabs';
import {
  senderId,
  selectedContacts,
  messageBody,
  messageMetrics,
} from '../../mock/sendSms';

export function ComposeForm() {
  return (
    <section className="lg:col-span-8 space-y-4" data-purpose="sms-compose-form">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
        {/* Sender ID */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Sender ID
            </label>
            <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" strokeWidth={2} />
          </div>
          <button
            type="button"
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 flex items-center justify-between text-left shadow-xs focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0] transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                {senderId.value}
              </span>
              {senderId.verified && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <Check className="w-2.5 h-2.5 mr-1" strokeWidth={3} />
                  Verified
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Your message will be sent from this Sender ID.
          </p>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Recipients */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Recipients
            </label>
          </div>

          <RecipientTabs />

          {/* Search bar + create */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" strokeWidth={2} />
              </span>
              <input
                className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] focus:border-[#1a6cf0]"
                placeholder="Search contacts..."
                type="text"
              />
            </div>
            <button
              className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1a6cf0] dark:text-blue-400 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 shadow-xs whitespace-nowrap justify-center"
              type="button"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Create Contact</span>
            </button>
          </div>

          {/* Selected tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              Selected: {selectedContacts.label}
            </span>
            <button
              className="text-[11px] font-semibold text-[#1a6cf0] dark:text-blue-400 hover:underline"
              type="button"
            >
              Clear all
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Message body */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Message
            </label>
          </div>

          <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 focus-within:ring-1 focus-within:ring-[#1a6cf0] focus-within:border-[#1a6cf0] shadow-xs">
            <textarea
              className="w-full border-none p-0 text-xs text-slate-700 dark:text-slate-200 bg-transparent focus:ring-0 focus:outline-none resize-none leading-relaxed"
              placeholder="Type your message here..."
              rows={6}
              defaultValue={messageBody}
            />
            <div className="flex justify-end pt-2">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {messageMetrics.characters}/{messageMetrics.maxCharacters}
              </span>
            </div>
          </div>

          {/* Segments & Units pills */}
          <div className="mt-3 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {messageMetrics.segments}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  SMS Segment
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {messageMetrics.estimatedUnits}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Estimated Units
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper banner */}
      <div className="bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2} />
          <span>
            Make sure your recipient numbers are in the correct format (e.g. +233XXXXXXXXX).
          </span>
        </div>
        <a
          className="text-[#1a6cf0] dark:text-blue-400 hover:underline font-medium text-[11px] whitespace-nowrap shrink-0"
          href="#"
        >
          View guidelines →
        </a>
      </div>
    </section>
  );
}