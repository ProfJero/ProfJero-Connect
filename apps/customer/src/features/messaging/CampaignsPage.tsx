import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, CalendarClock, Repeat, Cake, Send, XCircle, Trash2, FileText, MessageSquare } from 'lucide-react';
import { getSegmentInfo } from '@profjero/shared/sms-segments';
import { MessagingTabs } from '../../components/messaging/MessagingTabs';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { EmptyState, ErrorState, Notice, SkeletonRows, Spinner } from '../../components/ui/States';
import { btnPrimary, btnSecondary, cardClass, inputClass, labelClass } from '../../components/ui/buttons';
import { RecipientPicker } from '../../components/send-sms/RecipientPicker';
import { PersonalizeBar } from '../../components/send-sms/PersonalizeBar';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useWallet } from '../../lib/account';
import { parsePhoneList } from '../../lib/phone';
import { emptyRecipients, type RecipientDraft } from '../../lib/recipients';
import { cn } from '../../lib/utils';
import type { ContactGroup, CustomerSenderId } from '../../lib/types';

type Kind = 'once' | 'recurring' | 'birthday';
type Status = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

interface Campaign {
  id: string;
  name: string;
  kind: Kind;
  status: Status;
  senderId: string;
  message: string;
  recipients: string[];
  contactIds: string[];
  groupIds: string[];
  scheduledAt: string | null;
  repeat: 'daily' | 'weekly' | 'monthly' | null;
  endsAt: string | null;
  sendTime: string | null;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastBatchId: string | null;
  lastError: string | null;
  runs: number;
  estimate: { recipients: number; units: number } | null;
  createdAt: string;
}

const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  sending: { label: 'Sending', tone: 'info' },
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Not sent', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

const KIND: Record<Kind, { label: string; icon: typeof CalendarClock }> = {
  once: { label: 'One-time', icon: CalendarClock },
  recurring: { label: 'Recurring', icon: Repeat },
  birthday: { label: 'Birthday', icon: Cake },
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/**
 * Campaigns: scheduled sends. One-time, recurring (daily/weekly/monthly)
 * and birthday campaigns. Sent on time by the platform's scheduler; units
 * are taken when each run sends.
 */
export function CampaignsPage() {
  const list = useApi<{ campaigns: Campaign[] }>('/customer/campaigns');
  const [creating, setCreating] = useState<Kind | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'cancel' | 'delete' | 'send-now'; campaign: Campaign } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const campaigns = list.data?.campaigns ?? [];
  const active = campaigns.filter((c) => c.status === 'scheduled' || c.status === 'sending');
  const past = campaigns.filter((c) => !(c.status === 'scheduled' || c.status === 'sending'));

  const runAction = async () => {
    if (!confirm) return;
    setBusy(true);
    setActionError(null);
    const id = encodeURIComponent(confirm.campaign.id);
    try {
      if (confirm.action === 'delete') await api.del(`/customer/campaigns/${id}`);
      else await api.post(`/customer/campaigns/${id}/${confirm.action}`, {});
      setConfirm(null);
      list.refresh();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1764e0] text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <Megaphone className="w-6 h-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Campaigns</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Schedule messages, repeat them, or greet contacts on their birthday — automatically.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setCreating('once')} className={btnPrimary}>
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New campaign
        </button>
      </section>

      <MessagingTabs />

      {/* Quick starts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(
          [
            ['once', 'Schedule a message', 'Write now, send on the date and time you pick.'],
            ['recurring', 'Repeat a message', 'Daily, weekly or monthly reminders and updates.'],
            ['birthday', 'Birthday wishes', 'Every day, greet contacts whose birthday it is — by name.'],
          ] as const
        ).map(([k, title, body]) => {
          const Icon = KIND[k].icon;
          return (
            <button key={k} type="button" onClick={() => setCreating(k)} className={cn(cardClass, 'p-4 text-left hover:border-[#1764e0] transition')}>
              <div className="flex items-center gap-2 text-[#1764e0] dark:text-blue-400">
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{body}</p>
            </button>
          );
        })}
      </section>

      {list.loading && !list.data ? (
        <div className={cardClass}><SkeletonRows rows={4} /></div>
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.refresh} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Schedule your first message, set up a weekly reminder, or turn on birthday wishes."
        />
      ) : (
        <>
          <CampaignList title={`Upcoming & active (${active.length})`} campaigns={active} onAction={(action, campaign) => setConfirm({ action, campaign })} />
          {past.length > 0 && <CampaignList title={`Finished (${past.length})`} campaigns={past} onAction={(action, campaign) => setConfirm({ action, campaign })} />}
        </>
      )}

      <TemplatesSection />

      {creating && (
        <CampaignFormModal
          kind={creating}
          onClose={() => setCreating(null)}
          onSaved={() => {
            setCreating(null);
            list.refresh();
          }}
        />
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.action === 'delete' ? 'Delete campaign?' : confirm?.action === 'cancel' ? 'Cancel campaign?' : 'Send now?'}
        message={
          confirm?.action === 'delete'
            ? `“${confirm.campaign.name}” will be removed. Messages already sent stay in Message History.`
            : confirm?.action === 'cancel'
              ? `“${confirm?.campaign.name}” won't send again.`
              : `“${confirm?.campaign.name}” will start sending within a minute.`
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : confirm?.action === 'cancel' ? 'Cancel campaign' : 'Send now'}
        busy={busy}
        error={actionError}
        onConfirm={runAction}
        onClose={() => {
          setConfirm(null);
          setActionError(null);
        }}
      />
    </main>
  );
}

function CampaignList({
  title,
  campaigns,
  onAction,
}: {
  title: string;
  campaigns: Campaign[];
  onAction: (action: 'cancel' | 'delete' | 'send-now', c: Campaign) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      {campaigns.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Nothing scheduled.</p>
      ) : (
        <ul className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {campaigns.map((c) => {
            const Kind = KIND[c.kind];
            return (
              <li key={c.id} className={cn(cardClass, 'p-4 flex flex-col gap-3')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Kind.icon className="w-4 h-4 text-[#1764e0] dark:text-blue-400 shrink-0" strokeWidth={2} />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {Kind.label}
                      {c.kind === 'recurring' && c.repeat ? ` · ${c.repeat}` : ''}
                      {c.kind === 'birthday' && c.sendTime ? ` · every day at ${c.sendTime}` : ''} · from {c.senderId}
                    </p>
                  </div>
                  <Badge tone={STATUS[c.status].tone} label={STATUS[c.status].label} />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 line-clamp-3 whitespace-pre-wrap break-words">
                  {c.message}
                </p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Next send</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">{c.status === 'scheduled' ? when(c.nextRunAt) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">{c.kind === 'birthday' ? 'Contacts with a birthday' : 'Recipients'}</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">
                      {c.estimate ? `${c.estimate.recipients.toLocaleString()}${c.kind === 'birthday' ? '' : ` · ~${c.estimate.units.toLocaleString()} units`}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Sent so far</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">
                      {c.runs} time{c.runs === 1 ? '' : 's'}
                      {c.lastBatchId && (
                        <>
                          {' · '}
                          <Link className="text-[#1764e0] dark:text-blue-400 hover:underline" to={`/messaging/history/${encodeURIComponent(c.lastBatchId)}`}>
                            last result
                          </Link>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
                {c.lastError && <Notice tone="error">{c.lastError}</Notice>}
                <div className="flex flex-wrap gap-2 justify-end">
                  {c.status === 'scheduled' && (
                    <>
                      <button type="button" className={btnSecondary} onClick={() => onAction('send-now', c)}>
                        <Send className="w-3.5 h-3.5 -rotate-45" /> Send now
                      </button>
                      <button type="button" className={btnSecondary} onClick={() => onAction('cancel', c)}>
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {c.status !== 'sending' && (
                    <button type="button" aria-label={`Delete ${c.name}`} className={cn(btnSecondary, 'text-rose-700 dark:text-rose-400')} onClick={() => onAction('delete', c)}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// New campaign
// ─────────────────────────────────────────────────────────────────────

function toLocalInput(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function CampaignFormModal({ kind: initialKind, onClose, onSaved }: { kind: Kind; onClose: () => void; onSaved: () => void }) {
  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const groupsRes = useApi<{ groups: ContactGroup[] }>('/customer/contact-groups');
  const { data: wallet } = useWallet();
  const approved = (senderIds.data?.senderIds ?? []).filter((s) => s.status === 'approved');

  const [kind, setKind] = useState<Kind>(initialKind);
  const [name, setName] = useState(initialKind === 'birthday' ? 'Birthday wishes' : '');
  const [senderChoice, setSenderChoice] = useState('');
  const [message, setMessage] = useState(initialKind === 'birthday' ? 'Happy birthday {first_name|friend}! 🎉 Wishing you a wonderful year ahead.' : '');
  const [recipients, setRecipients] = useState<RecipientDraft>(emptyRecipients);
  const [defaults] = useState(() => toLocalInput(new Date(Date.now() + 60 * 60_000)));
  const [scheduledAt, setScheduledAt] = useState(defaults);
  const [repeat, setRepeat] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [endsAt, setEndsAt] = useState('');
  const [sendTime, setSendTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const senderId = senderChoice || approved[0]?.value || '';
  const seg = getSegmentInfo(message);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/customer/campaigns', {
        name: name.trim(),
        kind,
        senderId,
        message,
        recipients: [...parsePhoneList(recipients.manualText).valid, ...recipients.uploaded],
        contactIds: recipients.contacts.map((c) => c.id),
        groupIds: recipients.groupIds,
        ...(kind === 'birthday'
          ? { sendTime }
          : {
              scheduledAt: new Date(scheduledAt).toISOString(),
              ...(kind === 'recurring' ? { repeat, endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null } : {}),
            }),
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal open title="New campaign" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-5">
        <fieldset>
          <legend className={labelClass}>Type</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {(Object.keys(KIND) as Kind[]).map((k) => {
              const Icon = KIND[k].icon;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold',
                    kind === k ? 'border-[#1764e0] bg-blue-50 text-[#1764e0] dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {KIND[k].label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cm-name" className={labelClass}>Campaign name</label>
            <input id="cm-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Weekend sale" />
          </div>
          <div>
            <label htmlFor="cm-sender" className={labelClass}>Sender ID</label>
            {approved.length === 0 ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                You need an approved Sender ID first. <Link to="/messaging/sender-ids/request" className="underline font-semibold">Request one</Link>.
              </p>
            ) : (
              <select id="cm-sender" value={senderId} onChange={(e) => setSenderChoice(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
                {approved.map((s) => (
                  <option key={s.value} value={s.value}>{s.value}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <label htmlFor="cm-message" className="text-xs font-semibold text-slate-800 dark:text-slate-100">Message</label>
          </div>
          <PersonalizeBar message={message} onInsert={(t) => setMessage((m) => m + t)} onUseTemplate={setMessage} />
          <textarea id="cm-message" required rows={4} maxLength={1600} value={message} onChange={(e) => setMessage(e.target.value)} className={cn(inputClass, 'resize-y text-sm')} />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {seg.unitCount} characters · {seg.segmentCount} page{seg.segmentCount === 1 ? '' : 's'} per recipient
            {seg.encoding === 'UCS-2' ? ' (Unicode)' : ''}
          </p>
        </div>

        <div>
          <div className={labelClass}>{kind === 'birthday' ? 'Who (leave empty for all contacts)' : 'Recipients'}</div>
          <RecipientPicker value={recipients} onChange={setRecipients} groups={groupsRes.data?.groups ?? []} />
          {kind === 'birthday' && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Each day, only contacts whose date of birth is that day receive it. Add birthdays when editing a contact or
              importing a CSV.
            </p>
          )}
        </div>

        {kind === 'birthday' ? (
          <div className="max-w-xs">
            <label htmlFor="cm-time" className={labelClass}>Send every day at</label>
            <input id="cm-time" type="time" required value={sendTime} onChange={(e) => setSendTime(e.target.value)} className={inputClass} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="cm-at" className={labelClass}>{kind === 'recurring' ? 'First send' : 'Send at'}</label>
              <input id="cm-at" type="datetime-local" required min={defaults.slice(0, 16)} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
            </div>
            {kind === 'recurring' && (
              <>
                <div>
                  <label htmlFor="cm-repeat" className={labelClass}>Repeat</label>
                  <select id="cm-repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as typeof repeat)} className={cn(inputClass, 'cursor-pointer')}>
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cm-ends" className={labelClass}>Until (optional)</label>
                  <input id="cm-ends" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
                </div>
              </>
            )}
          </div>
        )}

        <Notice tone="info">
          Units are taken from your wallet when each send happens (balance now: {wallet ? `${wallet.availableUnits.toLocaleString()} units` : '—'}).
          If there aren't enough then, that send is skipped and you're notified.
        </Notice>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving || !senderId} className={btnPrimary}>
            {saving && <Spinner />}
            {kind === 'birthday' ? 'Turn on birthday wishes' : 'Schedule campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Saved templates
// ─────────────────────────────────────────────────────────────────────

function TemplatesSection() {
  const t = useApi<{ templates: Array<{ id: string; name: string; body: string }> }>('/customer/templates');
  const [error, setError] = useState<string | null>(null);
  const remove = async (id: string) => {
    setError(null);
    try {
      await api.del(`/customer/templates/${encodeURIComponent(id)}`);
      t.refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  const templates = t.data?.templates ?? [];
  return (
    <section className={cn(cardClass, 'p-5')}>
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#1764e0] dark:text-blue-400" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Saved templates</h2>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
        Save messages you send often from the Send SMS page (“Save as template”) and reuse them anywhere.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {templates.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No templates yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {templates.map((x) => (
            <li key={x.id} className="py-2.5 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{x.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 break-words">{x.body}</div>
              </div>
              <button type="button" aria-label={`Delete template ${x.name}`} onClick={() => void remove(x.id)} className="p-1.5 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
