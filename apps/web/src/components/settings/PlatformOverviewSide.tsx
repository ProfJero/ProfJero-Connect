import { FileText, Check, X, Download } from 'lucide-react';
import { platformOverview } from '../../mock/settings';

export function PlatformOverviewSide() {
  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Overview card */}
      <section
        className="bg-[#f0f6fe] rounded-xl border border-[#d6e6fe] p-5 shadow-xs"
        data-purpose="platform-overview-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-4 h-4" strokeWidth={2} />
          </div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">Platform Overview</h3>
        </div>

        <div className="space-y-2.5 text-xs">
          <OverviewRow label="Current Plan">
            <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px]">
              {platformOverview.plan}
            </span>
          </OverviewRow>
          <OverviewRow label="Total Projects">
            <span className="text-slate-900 font-bold">{platformOverview.totalProjects}</span>
          </OverviewRow>
          <OverviewRow label="Total API Keys">
            <span className="text-slate-900 font-bold">{platformOverview.totalApiKeys}</span>
          </OverviewRow>
          <OverviewRow label="Total SMS Units">
            <span className="text-slate-900 font-bold">{platformOverview.totalSmsUnits}</span>
          </OverviewRow>
          <OverviewRow label="Platform Status">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 font-bold text-[11px]">
                {platformOverview.status}
              </span>
            </div>
          </OverviewRow>
        </div>
      </section>

      {/* Success banner */}
      <div
        className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start justify-between shadow-xs"
        data-purpose="success-alert"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 leading-tight">Settings Updated</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Your general settings have been saved successfully.
            </p>
          </div>
        </div>
        <button
          className="text-emerald-600 hover:text-emerald-800 text-base leading-none p-1 font-semibold"
          type="button"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-1">
        <button
          className="flex items-center gap-2 bg-[#1976d2] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
          data-purpose="save-button"
        >
          <Download className="w-4 h-4 rotate-180" strokeWidth={2} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}

function OverviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600 font-medium">{label}</span>
      {children}
    </div>
  );
}