import { useRef, useState, type FormEvent } from 'react';
import { Upload, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Notice, Spinner } from '../ui/States';
import { btnPrimary, btnSecondary, inputClass, labelClass } from '../ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { csvToContacts, type ParsedContactRow } from '../../lib/csv';
import { GROUP_COLORS } from '../../lib/groupColors';
import { cn } from '../../lib/utils';
import type { Contact, ContactGroup, GroupColor, ImportResult } from '../../lib/types';

// ─────────────────────────────────────────────────────────────────────
// Add / edit contact
// ─────────────────────────────────────────────────────────────────────

export function ContactFormModal({
  open,
  contact,
  groups,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Null → create. */
  contact: Contact | null;
  groups: ContactGroup[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={open} title={contact ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      {/* Keyed so the form resets whenever a different contact is opened. */}
      <ContactForm key={contact?.id ?? 'new'} contact={contact} groups={groups} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function ContactForm({
  contact,
  groups,
  onClose,
  onSaved,
}: {
  contact: Contact | null;
  groups: ContactGroup[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact ? `+${contact.phone}` : '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [groupIds, setGroupIds] = useState<string[]>(contact?.groupIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, groupIds };
    try {
      if (contact) await api.put(`/customer/contacts/${encodeURIComponent(contact.id)}`, body);
      else await api.post('/customer/contacts', body);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="c-name" className={labelClass}>Name</label>
        <input id="c-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="c-phone" className={labelClass}>Phone number</label>
        <input
          id="c-phone"
          required
          inputMode="tel"
          placeholder="0241234567 or +233241234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="c-email" className={labelClass}>Email (optional)</label>
        <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      {groups.length > 0 && (
        <fieldset>
          <legend className={labelClass}>Groups</legend>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = groupIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupIds(on ? groupIds.filter((x) => x !== g.id) : [...groupIds, g.id])}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                    on
                      ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                  )}
                >
                  {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  {g.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Spinner />}
          {contact ? 'Save changes' : 'Add contact'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Import from CSV
// ─────────────────────────────────────────────────────────────────────

export function ImportContactsModal({
  open,
  groups,
  onClose,
  onImported,
}: {
  open: boolean;
  groups: ContactGroup[];
  onClose: () => void;
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedContactRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [groupId, setGroupId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setRows(null);
    setFileName(null);
    setGroupId('');
    setError(null);
    setResult(null);
    setBusy(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > 2 * 1024 * 1024) {
      setError('That file is larger than 2 MB. Split it into smaller files.');
      return;
    }
    const parsed = csvToContacts(await file.text());
    if (parsed.length === 0) {
      setError('No rows with phone numbers were found in that file.');
      return;
    }
    if (parsed.length > 2000) {
      setError(`That file has ${parsed.length.toLocaleString()} rows. Import up to 2,000 at a time.`);
      return;
    }
    setRows(parsed);
    setFileName(file.name);
  };

  const doImport = async () => {
    if (!rows) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<ImportResult>('/customer/contacts/import', {
        contacts: rows.map((r) => ({ name: r.name, phone: r.phone, email: r.email ?? null })),
        groupId: groupId || undefined,
      });
      setResult(res);
      onImported();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Import contacts" onClose={close}>
      {result ? (
        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <Notice tone="success">
            {result.created.toLocaleString()} added · {result.updated.toLocaleString()} updated ·{' '}
            {result.skipped.length.toLocaleString()} skipped
          </Notice>
          {result.skipped.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
              {result.skipped.slice(0, 100).map((s, i) => (
                <div key={i} className="px-3 py-1.5 flex justify-between gap-3">
                  <span className="font-mono">{s.phone}</span>
                  <span className="text-slate-400">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button type="button" onClick={close} className={btnPrimary}>Done</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload a <strong>.csv</strong> file with columns such as <code>name</code>, <code>phone</code> and{' '}
            <code>email</code>. Numbers already in your contacts are kept and simply added to the group you choose.
            Excel users: File → Save As → CSV.
          </p>
          <input ref={inputRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center hover:border-[#1a6cf0]"
          >
            <Upload className="w-5 h-5 text-slate-400 mx-auto" strokeWidth={2} />
            <span className="block text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 mt-2">
              {fileName ? `${fileName} — ${rows?.length.toLocaleString()} rows` : 'Choose a CSV file'}
            </span>
          </button>
          {rows && rows.length > 0 && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Preview: {rows.slice(0, 3).map((r) => `${r.name ? `${r.name} ` : ''}${r.phone}`).join(' · ')}
              {rows.length > 3 ? ' …' : ''}
            </div>
          )}
          {groups.length > 0 && (
            <div>
              <label htmlFor="import-group" className={labelClass}>Add everyone to a group (optional)</label>
              <select id="import-group" value={groupId} onChange={(e) => setGroupId(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
            <button type="button" onClick={doImport} disabled={!rows || busy} className={btnPrimary}>
              {busy && <Spinner />}
              Import {rows ? rows.length.toLocaleString() : ''} contacts
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Create / edit group
// ─────────────────────────────────────────────────────────────────────

export function GroupFormModal({
  open,
  group,
  onClose,
  onSaved,
}: {
  open: boolean;
  group: ContactGroup | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={open} title={group ? 'Edit group' : 'Create group'} onClose={onClose}>
      <GroupForm key={group?.id ?? 'new'} group={group} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function GroupForm({ group, onClose, onSaved }: { group: ContactGroup | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [color, setColor] = useState<GroupColor>(group?.color ?? 'blue');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { name: name.trim(), description: description.trim() || null, color };
    try {
      if (group) await api.put(`/customer/contact-groups/${encodeURIComponent(group.id)}`, body);
      else await api.post('/customer/contact-groups', body);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="g-name" className={labelClass}>Group name</label>
        <input id="g-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Customers, Staff, Parents" />
      </div>
      <div>
        <label htmlFor="g-desc" className={labelClass}>Description (optional)</label>
        <textarea id="g-desc" rows={2} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-none')} />
      </div>
      <fieldset>
        <legend className={labelClass}>Colour</legend>
        <div className="flex gap-2">
          {(Object.keys(GROUP_COLORS) as GroupColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center ring-offset-2 dark:ring-offset-slate-900',
                GROUP_COLORS[c].swatch,
                color === c && 'ring-2 ring-slate-400',
              )}
            >
              {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </fieldset>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Spinner />}
          {group ? 'Save changes' : 'Create group'}
        </button>
      </div>
    </form>
  );
}
