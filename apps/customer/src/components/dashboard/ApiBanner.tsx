import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ApiBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
      <div className="max-w-sm w-full">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
          Integrate with our API
        </h4>
        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-snug">
          Build powerful communication and digital services into your application.
        </p>
        <Link
          to="/api"
          className="mt-3 px-3 py-1.5 bg-[#1a6cf0] hover:bg-[#155cd0] text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <span>Get an API key</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="w-full md:w-56 bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-[10px] shadow-md border border-slate-800 select-none shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white text-[8px] font-sans font-bold">
            &lt;/&gt;
          </div>
        </div>
        <div className="space-y-0.5 leading-relaxed">
          <p className="text-cyan-400 font-semibold">
            POST <span className="text-slate-300 font-normal">/v1/sms/send</span>
          </p>
          <p className="text-slate-400">{'{'}</p>
          <p className="pl-2 text-slate-300">
            "recipients": [<span className="text-emerald-400">"233246789012"</span>],
          </p>
          <p className="pl-2 text-slate-300">
            "message": <span className="text-emerald-400">"Hello!"</span>,
          </p>
          <p className="pl-2 text-slate-300">
            "senderId": <span className="text-emerald-400">"MYBRAND"</span>
          </p>
          <p className="text-slate-400">{'}'}</p>
        </div>
      </div>
    </div>
  );
}