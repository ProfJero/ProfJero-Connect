import { Code2 } from 'lucide-react';
import { ApiStatusCard } from '../../components/api/ApiStatusCard';
import { ApiKeyCard } from '../../components/api/ApiKeyCard';
import { UsageMetrics } from '../../components/api/UsageMetrics';
import { IntegrationCards } from '../../components/api/IntegrationCards';

export function ApiPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Code2 className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            API &amp; Integrations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Connect your applications and systems to ProfJero Connect.
          </p>
        </div>
      </div>

      {/* Top row: status + key */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ApiStatusCard />
        <ApiKeyCard />
      </div>

      <UsageMetrics />
      <IntegrationCards />
    </main>
  );
}