import { Card } from '../ui/Card';
import { usageChart } from '../../mock/projectDetails';

export function ProjectUsageCard() {
  return (
    <Card className="p-4 lg:col-span-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">Usage</h4>
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium">
            <button className="bg-blue-600 text-white px-2.5 py-1 rounded-md shadow-xs">
              SMS Usage
            </button>
            <button className="text-slate-600 hover:text-slate-900 px-2.5 py-1">Unit Usage</button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 text-[11px] font-medium">SMS Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-600 text-[11px] font-medium">Failed SMS</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-2 items-end">
          <div className="col-span-8">
            <div className="relative h-44 flex flex-col justify-between border-l border-b border-slate-200 pl-2">
              {[
                { label: '2,000', pos: 'top-0' },
                { label: '1,500', pos: 'top-1/4' },
                { label: '1,000', pos: 'top-2/4' },
                { label: '500', pos: 'top-3/4' },
              ].map((g) => (
                <div
                  key={g.label}
                  className={`absolute inset-x-0 ${g.pos} border-t border-dashed border-slate-100`}
                >
                  <span className="text-[9px] text-slate-400 -translate-y-2.5 inline-block">
                    {g.label}
                  </span>
                </div>
              ))}
              <div className="absolute inset-x-0 bottom-0">
                <span className="text-[9px] text-slate-400 -translate-y-2.5 inline-block">0</span>
              </div>

              <div className="h-full flex items-end justify-between px-2 pt-4 relative z-10">
                {usageChart.days.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-end gap-0.5 h-36">
                      <div
                        className="w-2.5 bg-blue-600 rounded-t-sm"
                        style={{ height: `${d.smsHeight}%` }}
                      />
                      <div
                        className="w-2.5 bg-red-400 rounded-t-sm"
                        style={{ height: `${d.failedHeight}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 pl-3 border-l border-slate-100 flex flex-col justify-center space-y-3.5">
            <h5 className="text-xs font-bold text-slate-800">Usage Summary</h5>
            <div className="space-y-2">
              {[
                { label: 'Total SMS Sent', value: usageChart.summary.totalSmsSent },
                { label: 'Total Units Used', value: usageChart.summary.totalUnitsUsed },
                { label: 'Failed SMS', value: usageChart.summary.failedSms },
                { label: 'Success Rate', value: usageChart.summary.successRate },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-bold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}