import { useState, type FormEvent } from 'react';
import { Building2, Mail, User, Phone, AlertCircle } from 'lucide-react';
import { useProfile } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';

interface OrgInfoCardProps {
  /** Parent toggles this to enter edit mode. */
  editing?: boolean;
  /** Called when edit is committed or cancelled, so parent can reset. */
  onDone?: () => void;
}

export function OrgInfoCard({ editing = false, onDone }: OrgInfoCardProps) {
  const { data, loading, error, saving, update } = useProfile();
  const { refresh: refreshAuth } = useAuth();

  // Local form state mirrors the customer doc when editing begins.
  const [displayName, setDisplayName] = useState('');
  const [organisationName, setOrganisationName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset local state every time we enter edit mode, so abandoned
  // edits don't leak into a fresh edit session.
  // (Keyed on `editing`; runs on every entry.)
  useState(() => {
    if (data && editing) {
      setDisplayName(data.customer.displayName);
      setOrganisationName(data.customer.organisationName ?? data.project.name);
      setPhone(data.customer.phone ?? '');
    }
  });

  // Re-sync the form each time editing flips from false to true.
  // Using a ref-based tracking would be cleaner, but for a three-field
  // form the "sync on entry" pattern is fine.
  if (editing && data) {
    const anyInputBlank =
      !displayName && !organisationName && !phone;
    if (anyInputBlank) {
      // First render in edit mode — seed from server data.
      // This runs once per edit session.
      if (displayName !== data.customer.displayName) {
        setDisplayName(data.customer.displayName);
      }
      if (
        organisationName !==
        (data.customer.organisationName ?? data.project.name)
      ) {
        setOrganisationName(
          data.customer.organisationName ?? data.project.name,
        );
      }
      if (phone !== (data.customer.phone ?? '')) {
        setPhone(data.customer.phone ?? '');
      }
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!displayName.trim()) {
      setFormError('Contact person name cannot be empty.');
      return;
    }
    if (!organisationName.trim()) {
      setFormError('Organisation name cannot be empty.');
      return;
    }

    try {
      await update({
        displayName: displayName.trim(),
        organisationName: organisationName.trim(),
        phone: phone.trim() || null,
      });
      // Topbar and greeting read the name from the auth context.
      await refreshAuth();
      onDone?.();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not save changes.',
      );
    }
  };

  const handleCancel = () => {
    setFormError(null);
    onDone?.();
  };

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#1764e0] dark:text-blue-400 shrink-0">
          <Building2 className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Organisation Information
        </h3>
      </div>

      {loading ? (
        <div className="mt-4 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-12 py-1 items-center gap-2">
              <div className="col-span-5 h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-7 h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span>Could not load organisation information. Refresh to try again.</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          <Row
            label="Business/Organisation Name"
            icon={Building2}
            editing={editing}
            value={organisationName}
            onChange={setOrganisationName}
            placeholder="e.g. SunnyTech Ltd"
          />

          <Row
            label="Contact Person"
            icon={User}
            editing={editing}
            value={displayName}
            onChange={setDisplayName}
            placeholder="e.g. Jane Doe"
          />

          <Row
            label="Phone Number"
            icon={Phone}
            editing={editing}
            value={phone}
            onChange={setPhone}
            placeholder="e.g. +233 24 123 4567"
          />

          <ReadOnlyRow
            label="Email Address"
            icon={Mail}
            value={data?.customer.email ?? '—'}
            note="Change via account security settings"
          />

          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
              <span className="leading-relaxed">{formError}</span>
            </div>
          )}

          {editing && (
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-xs font-semibold shadow-xs transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// ── Row primitives ──────────────────────────────────────────────────

function Row({
  label,
  icon: Icon,
  editing,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: typeof Building2;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="grid grid-cols-12 py-1 items-center gap-2">
      <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 shrink-0" strokeWidth={2} />
        {label}
      </span>
      <span className="col-span-7">
        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-lg border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs',
              'text-slate-900 dark:text-slate-100',
              'focus:outline-none focus:border-[#1a6cf0] focus:ring-2 focus:ring-[#1a6cf0]/30',
            )}
          />
        ) : (
          <span className="text-slate-900 dark:text-slate-100 font-semibold break-words">
            {value || '—'}
          </span>
        )}
      </span>
    </div>
  );
}

function ReadOnlyRow({
  label,
  icon: Icon,
  value,
  note,
}: {
  label: string;
  icon: typeof Building2;
  value: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-12 py-1 items-start gap-2">
      <span className="col-span-5 text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 pt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 shrink-0" strokeWidth={2} />
        {label}
      </span>
      <span className="col-span-7">
        <span className="block text-slate-900 dark:text-slate-100 font-semibold break-all">
          {value}
        </span>
        {note && (
          <span className="block text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">
            {note}
          </span>
        )}
      </span>
    </div>
  );
}