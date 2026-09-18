import { Info, Lightbulb } from 'lucide-react';
import { ProviderMetricCard } from '../../components/arkesel/ProviderMetricCard';
import { SenderIdsTable } from '../../components/arkesel/SenderIdsTable';
import { ApiMonitoring } from '../../components/arkesel/ApiMonitoring';
import { ProviderActivity } from '../../components/arkesel/ProviderActivity';
import { ProviderBalanceCard } from '../../components/arkesel/ProviderBalanceCard';
import { SecureProviderSettings } from '../../components/arkesel/SecureProviderSettings';
import { RecentApiErrors } from '../../components/arkesel/RecentApiErrors';
import { providerMetrics } from '../../mock/arkesel';

export function ArkeselPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <div>
          <span className="font-bold text-blue-950">Provider Infrastructure → Arkesel</span>
          <span className="text-blue-700 ml-1.5">
            This is the main SMS provider account. Client/project wallets are managed separately.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Provider overview */}
          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900">Provider Overview</h2>
              <p className="text-xs text-slate-500">
                Real-time status of your Arkesel connection and account.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {providerMetrics.map((m) => (
                <ProviderMetricCard key={m.label} metric={m} />
              ))}
            </div>
          </section>

          {/* Sender IDs */}
          <SenderIdsTable />

          {/* API Monitoring + Provider Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiMonitoring />
            <ProviderActivity />
          </div>

          {/* Bottom note */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
            <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <span className="font-bold text-slate-800">Important</span>
              <p className="mt-0.5 text-slate-600">
                ProfJero SMS uses Arkesel as the underlying SMS provider. Client/project wallets
                are managed independently and are not affected by your provider balance.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <ProviderBalanceCard />
          <SecureProviderSettings />
          <RecentApiErrors />
        </div>
      </div>
    </main>
  );
}