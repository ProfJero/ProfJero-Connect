import { Upload, Building2 } from 'lucide-react';
import { orgAccountType } from '../../mock/organisation';

export function ChangeLogoCard() {
  return (
    <button className="bg-blue-50/40 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 hover:bg-blue-50/70 dark:hover:bg-blue-500/15 transition-colors cursor-pointer flex items-center gap-4 text-left w-full">
      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
        <Upload className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-[#1a6cf0] dark:text-blue-400">
          Change Organisation Logo
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
          Upload a new logo for your organisation (JPG, PNG, SVG).
        </p>
      </div>
    </button>
  );
}

export function AccountTypeCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
        Account Type
      </span>
      <div className="mt-3.5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {orgAccountType.type}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {orgAccountType.description}
          </p>
        </div>
      </div>
    </div>
  );
}