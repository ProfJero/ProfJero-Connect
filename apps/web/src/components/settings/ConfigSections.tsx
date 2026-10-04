import { useState, type FormEvent } from 'react';
import type {
  GeneralSettings,
  NotificationSettings,
  PaymentSettings,
  SecuritySettings,
  SmsSettings,
} from '@profjero/shared';
import { Field, SaveBar, SectionCard, Toggle, inputCls, useDraft } from './fields';
import type { SaveMessage } from './useSettings';

interface SectionProps<T> {
  value: T;
  canEdit: boolean;
  saving: boolean;
  onSave: (v: T) => Promise<SaveMessage>;
  updated: string | null;
}

function useSection<T>(props: SectionProps<T>) {
  const draft = useDraft(props.value);
  const [message, setMessage] = useState<SaveMessage | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const result = await props.onSave(draft.value);
    setMessage(result);
    if (result.tone === 'success') draft.reset();
  };
  return { draft, message, submit };
}

function Updated({ at }: { at: string | null }) {
  if (!at) return <p className="text-[11px] text-slate-500 mb-4">Using defaults — never changed.</p>;
  return <p className="text-[11px] text-slate-500 mb-4">Last changed {new Date(at).toLocaleString()}.</p>;
}

/** Number input bound to an int or null ("" = null when nullable). */
function NumberInput({
  id,
  value,
  onChange,
  nullable,
  min,
  max,
  disabled,
  placeholder,
}: {
  id: string;
  value: number | null;
  onChange: (v: number | null) => void;
  nullable?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      disabled={disabled}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(nullable ? null : (min ?? 0));
        const n = Math.trunc(Number(raw));
        if (Number.isFinite(n)) onChange(n);
      }}
      className={inputCls}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────

export function GeneralSection(props: SectionProps<GeneralSettings>) {
  const { draft, message, submit } = useSection(props);
  const v = draft.value;
  const ro = !props.canEdit;
  return (
    <SectionCard title="General" description="Platform identity and the support contact customers see." readOnly={ro}>
      <Updated at={props.updated} />
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Platform name" htmlFor="g-name" hint="Shown in the customer app and in emails.">
          <input id="g-name" required maxLength={60} disabled={ro} value={v.platformName} onChange={(e) => draft.set('platformName', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Time zone" htmlFor="g-tz" hint="IANA name, e.g. Africa/Accra. Used for daily report boundaries.">
          <input id="g-tz" required maxLength={60} disabled={ro} value={v.timezone} onChange={(e) => draft.set('timezone', e.target.value)} className={inputCls} list="tz-list" />
          <datalist id="tz-list">
            {['Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Europe/London', 'UTC'].map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Field>
        <Field label="Support email" htmlFor="g-email" hint="Customers see a “Contact support” button with this address.">
          <input id="g-email" type="email" maxLength={200} disabled={ro} value={v.supportEmail ?? ''} onChange={(e) => draft.set('supportEmail', e.target.value.trim() || null)} className={inputCls} placeholder="support@yourdomain.com" />
        </Field>
        <Field label="Support phone" htmlFor="g-phone">
          <input id="g-phone" type="tel" maxLength={30} disabled={ro} value={v.supportPhone ?? ''} onChange={(e) => draft.set('supportPhone', e.target.value.trim() || null)} className={inputCls} placeholder="+233 …" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Business address" htmlFor="g-addr">
            <input id="g-addr" maxLength={200} disabled={ro} value={v.address ?? ''} onChange={(e) => draft.set('address', e.target.value.trim() || null)} className={inputCls} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <SaveBar dirty={draft.dirty} saving={props.saving} onReset={draft.reset} message={message} disabled={ro} />
        </div>
      </form>
    </SectionCard>
  );
}

export function SmsSection(props: SectionProps<SmsSettings>) {
  const { draft, message, submit } = useSection(props);
  const v = draft.value;
  const ro = !props.canEdit;
  return (
    <SectionCard title="SMS" description="Defaults for customer accounts and sending." readOnly={ro}>
      <Updated at={props.updated} />
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Welcome credit (units)" htmlFor="s-starter" hint="Credited once to every new customer signup. 0 turns it off.">
          <NumberInput id="s-starter" min={0} max={1000} disabled={ro} value={v.starterUnits} onChange={(n) => draft.set('starterUnits', n ?? 0)} />
        </Field>
        <Field label="Default low-balance alert (units)" htmlFor="s-thresh" hint="Given to new customer wallets. Leave empty for no default alert.">
          <NumberInput id="s-thresh" nullable min={1} disabled={ro} value={v.defaultLowBalanceThreshold} onChange={(n) => draft.set('defaultLowBalanceThreshold', n)} placeholder="Off" />
        </Field>
        <Field label="Max recipients per customer send" htmlFor="s-max" hint="Between 1 and 10,000. Larger lists are rejected before any units are reserved. Big sends are delivered in the background.">
          <NumberInput id="s-max" min={1} max={10000} disabled={ro} value={v.maxRecipientsPerSend} onChange={(n) => draft.set('maxRecipientsPerSend', n ?? 1)} />
        </Field>
        <Field label="Sender ID review time (shown to customers)" htmlFor="s-sla" hint={<>Completes the sentence “usually takes <em>…</em>”.</>}>
          <input id="s-sla" required maxLength={80} disabled={ro} value={v.senderIdReviewSla} onChange={(e) => draft.set('senderIdReviewSla', e.target.value)} className={inputCls} />
        </Field>
        <div className="md:col-span-2">
          <SaveBar dirty={draft.dirty} saving={props.saving} onReset={draft.reset} message={message} disabled={ro} />
        </div>
      </form>
    </SectionCard>
  );
}

export function PaymentsSection(props: SectionProps<PaymentSettings>) {
  const { draft, message, submit } = useSection(props);
  const v = draft.value;
  const ro = !props.canEdit;
  return (
    <SectionCard title="Payments" description="Customer self-service top-ups. Prices live on the Pricing page." readOnly={ro}>
      <Updated at={props.updated} />
      <form onSubmit={submit} className="space-y-3">
        <Toggle
          id="p-enabled"
          label="Customer top-ups enabled"
          description="Turn off to pause Add Funds (e.g. during a gateway incident). Webhooks for payments already in progress still credit wallets."
          checked={v.customerTopupsEnabled}
          disabled={ro}
          onChange={(b) => draft.set('customerTopupsEnabled', b)}
        />
        <Field label="Message while top-ups are paused" htmlFor="p-msg">
          <input id="p-msg" maxLength={200} disabled={ro} value={v.topupsDisabledMessage ?? ''} onChange={(e) => draft.set('topupsDisabledMessage', e.target.value.trim() || null)} className={inputCls} placeholder="Top-ups are temporarily unavailable. Please try again later." />
        </Field>
        <SaveBar dirty={draft.dirty} saving={props.saving} onReset={draft.reset} message={message} disabled={ro} />
      </form>
    </SectionCard>
  );
}

export function NotificationsSection(props: SectionProps<NotificationSettings>) {
  const { draft, message, submit } = useSection(props);
  const v = draft.value;
  const ro = !props.canEdit;
  const [emailText, setEmailText] = useState<string | null>(null);
  const emails = emailText ?? v.adminAlertEmails.join(', ');
  return (
    <SectionCard title="Notifications" description="Operator emails for events that need attention. Requires email (Resend) to be configured — see System." readOnly={ro}>
      <Updated at={props.updated} />
      <form
        onSubmit={(e) => {
          setEmailText(null);
          void submit(e);
        }}
        className="space-y-3"
      >
        <Field label="Send admin alerts to" htmlFor="n-emails" hint="Comma-separated, up to 10 addresses.">
          <input
            id="n-emails"
            disabled={ro}
            value={emails}
            onChange={(e) => {
              setEmailText(e.target.value);
              draft.set('adminAlertEmails', e.target.value.split(/[,\s;]+/).map((x) => x.trim()).filter(Boolean));
            }}
            className={inputCls}
            placeholder="ops@yourdomain.com"
          />
        </Field>
        <div className="divide-y divide-slate-100">
          <Toggle id="n-sid" label="New Sender ID request" description="So it can be registered with the provider quickly." checked={v.emailOnSenderIdRequest} disabled={ro} onChange={(b) => draft.set('emailOnSenderIdRequest', b)} />
          <Toggle id="n-cust" label="New customer signup" checked={v.emailOnNewCustomer} disabled={ro} onChange={(b) => draft.set('emailOnNewCustomer', b)} />
          <Toggle id="n-pay" label="Customer payment received" checked={v.emailOnPaymentReceived} disabled={ro} onChange={(b) => draft.set('emailOnPaymentReceived', b)} />
          <Toggle id="n-prov" label="Provider balance low" description="Checked every 15 minutes." checked={v.emailOnProviderLowBalance} disabled={ro} onChange={(b) => draft.set('emailOnProviderLowBalance', b)} />
        </div>
        <Field label="Provider low-balance level (credits)" htmlFor="n-provlow" hint="Raises a bell alert (and email, if on) when provider credits drop below this. Empty = off.">
          <NumberInput id="n-provlow" nullable min={0} disabled={ro} value={v.providerLowBalanceCredits} onChange={(n) => draft.set('providerLowBalanceCredits', n)} placeholder="Off" />
        </Field>
        <SaveBar dirty={draft.dirty} saving={props.saving} onReset={() => { draft.reset(); setEmailText(null); }} message={message} disabled={ro} />
      </form>
    </SectionCard>
  );
}

export function SecuritySection(props: SectionProps<SecuritySettings>) {
  const { draft, message, submit } = useSection(props);
  const v = draft.value;
  const ro = !props.canEdit;
  return (
    <SectionCard title="Security" description="Customer access and abuse limits. Super admins only." readOnly={ro}>
      <Updated at={props.updated} />
      <form onSubmit={submit} className="space-y-4">
        <Toggle
          id="sec-signup"
          label="Customer sign-ups open"
          description="Turn off to stop new registrations. Existing customers are unaffected."
          checked={v.customerSignupsEnabled}
          disabled={ro}
          onChange={(b) => draft.set('customerSignupsEnabled', b)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer sends per minute (per account)" htmlFor="sec-sends" hint="Excess sends get HTTP 429. 1–600.">
            <NumberInput id="sec-sends" min={1} max={600} disabled={ro} value={v.customerSendsPerMinute} onChange={(n) => draft.set('customerSendsPerMinute', n ?? 1)} />
          </Field>
          <Field label="Customer API calls per minute (per account)" htmlFor="sec-req" hint="All customer endpoints. 10–6,000.">
            <NumberInput id="sec-req" min={10} max={6000} disabled={ro} value={v.customerRequestsPerMinute} onChange={(n) => draft.set('customerRequestsPerMinute', n ?? 10)} />
          </Field>
        </div>
        <p className="text-[11px] text-slate-500">
          Also enforced, not configurable: 10 sign-ups per hour per network address, 10 checkout attempts per minute,
          10 API keys per hour and 10 Sender ID requests per day per account.
        </p>
        <SaveBar dirty={draft.dirty} saving={props.saving} onReset={draft.reset} message={message} disabled={ro} />
      </form>
    </SectionCard>
  );
}
