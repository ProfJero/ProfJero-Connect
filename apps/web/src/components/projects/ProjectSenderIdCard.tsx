import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { senderIdInfo } from '../../mock/projectDetails';

export function ProjectSenderIdCard() {
  return (
    <Card className="p-4 lg:col-span-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">Sender ID</h4>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            {senderIdInfo.status}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Assigned Sender ID</div>
            <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {senderIdInfo.value}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 font-medium">Status</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                {senderIdInfo.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[11px] text-slate-500">
              This Sender ID is verified and ready for use.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button className="w-full bg-sky-50 hover:bg-sky-100/70 text-blue-600 text-xs font-semibold py-2 px-3 rounded-lg border border-sky-200/80 flex items-center justify-center gap-1.5 transition-colors">
          <span>View Sender ID Details</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </Card>
  );
}