import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Pencil } from 'lucide-react';
import { OrgIdentityBanner } from '../../components/settings/OrgIdentityBanner';
import { OrgInfoCard } from '../../components/settings/OrgInfoCard';
import { ChangeLogoCard, AccountTypeCard } from '../../components/settings/OrgSideCards';

export function OrganisationProfilePage() {
  const [editing, setEditing] = useState(false);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
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
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={editing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a6cf0] hover:bg-[#155cd0] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            {editing ? 'Editing…' : 'Edit Profile'}
          </button>
        </div>
      </section>

      <OrgIdentityBanner />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <OrgInfoCard editing={editing} onDone={() => setEditing(false)} />
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-start">
          <ChangeLogoCard />
          <AccountTypeCard />
        </div>
      </section>

      {/*
        OrgStatCards removed for CP1.

        Team Members, Projects, API Keys, Sender IDs and the wallet
        summary were all mocked. None of those have /customer/*
        endpoints yet, and per docs/customer-platform.md §12 we don't
        ship fake numbers on real pages.

        Restore when the endpoints exist:
          - Team Members: post-v1 (multi-user orgs)
          - Projects:     always 1 for v1 (customer = one project)
          - API Keys:     future /customer/api-keys endpoint
          - Sender IDs:   CP3 (/customer/sender-ids)
          - Wallet:       already on /wallet — no need to duplicate
      */}
    </main>
  );
}