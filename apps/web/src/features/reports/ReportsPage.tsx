import { Calendar, ChevronDown, Bell } from 'lucide-react';
import { KpiCard } from '../../components/reports/KpiCard';
import { SmsAnalyticsCard } from '../../components/reports/SmsAnalyticsCard';
import { ProjectPerformanceTable } from '../../components/reports/ProjectPerformanceTable';
import { SmsVolumeTrendChart } from '../../components/reports/SmsVolumeTrendChart';
import { UnitConsumptionDonut } from '../../components/reports/UnitConsumptionDonut';
import { RevenueCostChart } from '../../components/reports/RevenueCostChart';
import { FinancialAnalytics } from '../../components/reports/FinancialAnalytics';
import { UsageTrendsChart } from '../../components/reports/UsageTrendsChart';
import { RecentProviderActivity } from '../../components/reports/RecentProviderActivity';
import { ReportsFooterBanners } from '../../components/reports/ReportsFooterBanners';
import { kpiCards } from '../../mock/reports';
import { cn } from '../../lib/utils';

const PERIODS = ['Today', '7D', '30D', '3M', '6M', '12M', 'Custom'] as const;

export function ReportsPage() {
  return (
    <main className="p-7 space-y-6 flex-1">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <span>Sep 15, 2025 - Sep 21, 2025</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={cn(
                  'px-2.5 py-1 rounded',
                  p === '30D'
                    ? 'bg-[#1976d2] text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-700">
          <Bell className="w-5 h-5" strokeWidth={2} />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>
      </div>

      {/* 5 KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((c) => (
          <KpiCard key={c.label} card={c} />
        ))}
      </section>

      {/* Row 1: SMS Analytics + Project Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SmsAnalyticsCard />
        <ProjectPerformanceTable />
      </section>

      {/* Row 2: Volume Trend + Donut + Revenue/Cost */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <SmsVolumeTrendChart />
        <UnitConsumptionDonut />
        <RevenueCostChart />
      </section>

      {/* Row 3: Financial + Usage Trends + Provider Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <FinancialAnalytics />
        <UsageTrendsChart />
        <RecentProviderActivity />
      </section>

      {/* Footer banners */}
      <ReportsFooterBanners />
    </main>
  );
}