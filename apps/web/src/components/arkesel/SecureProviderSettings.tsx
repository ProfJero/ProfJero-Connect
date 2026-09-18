import { Lock, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { secureSettings } from '../../mock/arkesel';

export function SecureProviderSettings() {
  return (
    <Card className="p-5 space-y-4" data-purpose="provider-settings">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-700" strokeWidth={2} />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Secure Provider Settings</h3>
          <p className="text-[11px] text-slate-500">
            Manage your Arkesel API credentials securely.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <Field label="API Key" value={secureSettings.apiKey} variant="masked" actionLabel="Update" />
        <Field
          label="API Secret"
          value={secureSettings.apiSecret}
          variant="masked"
          actionLabel="Update"
        />
        <Field
          label="Account ID"
          value={secureSettings.accountId}
          variant="mono"
          actionLabel="View"
        />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-emerald-800">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2} />
        <p>Your credentials are encrypted and never shown in plain text for security.</p>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  variant,
  actionLabel,
}: {
  label: string;
  value: string;
  variant: 'masked' | 'mono';
  actionLabel: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          className={
            variant === 'masked'
              ? 'flex-1 bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-3 text-slate-500 tracking-widest focus:outline-none'
              : 'flex-1 bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-3 text-slate-700 font-mono focus:outline-none'
          }
          readOnly
          type={variant === 'masked' ? 'password' : 'text'}
          value={value}
        />
        <button className="border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}