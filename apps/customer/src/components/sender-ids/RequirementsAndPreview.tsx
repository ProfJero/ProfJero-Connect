import { ShieldCheck, Check, Eye, Info } from 'lucide-react';
import { senderIdRequirements } from '../../mock/requestSenderId';

export function RequirementsCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-6 h-6 rounded-md bg-[#1a6cf0] flex items-center justify-center text-white shrink-0">
          <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Sender ID Requirements
        </h3>
      </div>

      <div className="space-y-4 text-xs">
        {senderIdRequirements.map((req) => (
          <div key={req.title} className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-[#1a6cf0] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{req.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {req.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PreviewCard({ senderId }: { senderId: string }) {
  const display = senderId.trim() || 'YOURBRAND';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-[#1a6cf0] flex items-center justify-center text-white shrink-0">
          <Eye className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Preview</h3>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Your SMS will appear as:
      </p>

      <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg py-7 flex items-center justify-center mb-4 min-h-[88px]">
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-wider break-all px-4 text-center">
          {display}
        </span>
      </div>

      <div className="bg-[#f0f7ff] dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-3 flex items-start gap-2.5">
        <div className="w-4 h-4 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-2.5 h-2.5" strokeWidth={2.5} />
        </div>
        <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-snug">
          This is a preview. Your actual Sender ID will be confirmed after approval.
        </p>
      </div>
    </div>
  );
}