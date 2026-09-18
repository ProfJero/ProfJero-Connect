import { MessageSquare, Download } from 'lucide-react';
import { MetricCard } from '../../components/sms-logs/MetricCard';
import { SmsLogsFilterBar } from '../../components/sms-logs/SmsLogsFilterBar';
import { SmsLogsTable } from '../../components/sms-logs/SmsLogsTable';
import { SmsDetailsInspector } from '../../components/sms-logs/SmsDetailsInspector';
import { smsMetrics } from '../../mock/smsLogs';

export function SmsLogsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <MessageSquare className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">SMS Logs</h2>
            <p className="text-xs text-slate-500">
              View, track and manage all SMS sent through ProfJero SMS.
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all"
          type="button"
        >
          <Download className="w-4 h-4" strokeWidth={2} />
          <span>Export Logs</span>
        </button>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {smsMetrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </section>

      {/* Filter toolbar */}
      <SmsLogsFilterBar />

      {/* Table + Details inspector */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <SmsLogsTable />
        <SmsDetailsInspector />
      </div>
    </main>
  );
}