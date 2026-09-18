import { Eye, RefreshCw, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { apiInfo } from '../../mock/projectDetails';

export function ProjectApiCard() {
  return (
    <Card className="p-4 lg:col-span-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">API</h4>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            {apiInfo.status}
          </span>
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-medium text-slate-500 block mb-1.5">
            API Key (Identifier)
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 px-2.5 py-1.5 pr-7 focus:outline-none"
                readOnly
                type="text"
                defaultValue={apiInfo.keyMasked}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Eye className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-medium px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-xs whitespace-nowrap">
              <RefreshCw className="w-3 h-3 text-blue-500" strokeWidth={2} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
          <Stat label="Requests Today" value={apiInfo.stats.requestsToday} />
          <Stat label="Requests This Month" value={apiInfo.stats.requestsThisMonth} />
          <Stat label="Failed Requests" value={apiInfo.stats.failedRequests} />
        </div>

        <div className="text-[10px] text-slate-500 mt-3 flex items-center gap-1.5">
          <span className="font-medium">Last API Activity:</span>
          <span className="font-semibold text-slate-700">{apiInfo.lastActivity}</span>
        </div>
      </div>

      <div className="mt-4 bg-sky-50/80 border border-sky-100 rounded-lg p-2.5 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[10px] text-sky-700 leading-normal">
          Your API is active and ready to use. Keep your key secure and do not share it with
          unauthorized users.
        </p>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 block font-medium leading-tight">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}