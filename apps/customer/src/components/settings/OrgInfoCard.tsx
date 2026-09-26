import { Building2, MapPin, Link2 } from 'lucide-react';
import { orgDetails } from '../../mock/organisation';

export function OrgInfoCard() {
  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400 shrink-0">
          <Building2 className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Organisation Information
        </h3>
      </div>

      <div className="mt-4 space-y-4 text-xs">
        {orgDetails.map((row) => (
          <div key={row.label} className="grid grid-cols-12 py-1 items-center gap-2">
            <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium">
              {row.label}
            </span>
            <span className="col-span-7 text-slate-900 dark:text-slate-100 font-semibold break-words">
              {row.link ? (
                <a
                  href={row.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a6cf0] dark:text-blue-400 hover:underline flex items-center gap-1.5 break-all"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  {row.value}
                </a>
              ) : row.icon === 'location' ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1a6cf0] dark:text-blue-400 shrink-0" strokeWidth={2} />
                  {row.value}
                </span>
              ) : (
                row.value
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}