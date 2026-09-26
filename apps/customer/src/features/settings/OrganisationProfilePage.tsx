import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { OrgIdentityBanner } from '../../components/settings/OrgIdentityBanner';
import { OrgInfoCard } from '../../components/settings/OrgInfoCard';
import { ChangeLogoCard, AccountTypeCard } from '../../components/settings/OrgSideCards';
import { OrgStatCards } from '../../components/settings/OrgStatCards';

export function OrganisationProfilePage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1a6cf0] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Organisation Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              View and manage your organisation details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Back to Settings
          </Link>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-xs font-semibold shadow-xs transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit Profile
          </button>
        </div>
      </section>

      <OrgIdentityBanner />

      {/* Details + side cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <OrgInfoCard />
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-start">
          <ChangeLogoCard />
          <AccountTypeCard />
        </div>
      </section>

      <OrgStatCards />
    </main>
  );
}