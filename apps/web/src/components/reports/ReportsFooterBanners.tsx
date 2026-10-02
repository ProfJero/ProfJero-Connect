import { Info, MessageSquare, Server, Radio } from 'lucide-react';

export function ReportsFooterBanners() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Important notice */}
      <div className="lg:col-span-8 bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <div className="text-xs text-blue-900 leading-snug">
          <span className="font-bold">Important:</span> This report shows ProfJero SMS usage and
          revenue. Customer/project wallets are managed independently and are not affected by your
          provider balance.
        </div>
      </div>

      {/* Infrastructure flow */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span>ProfJero SMS</span>
        </div>
        <span className="text-slate-500 font-normal">→</span>
        <div className="flex items-center gap-1.5">
          <Server className="w-4 h-4 text-slate-500" strokeWidth={2} />
          <span>Provider Infrastructure</span>
        </div>
        <span className="text-slate-500 font-normal">→</span>
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span>SMS Gateway 01</span>
        </div>
      </div>
    </section>
  );
}