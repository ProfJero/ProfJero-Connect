import { useRef, useState, type FormEvent } from 'react';
import { Upload, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Notice, Spinner } from '../ui/States';
import { btnPrimary, btnSecondary, inputClass, labelClass } from '../ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { COLUMN_ROLE_LABELS, guessRole, mapImportRows, readImportTable, type ColumnRole, type ImportTable } from '../../lib/csv';
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
  // Older contacts may only have a full name: split it for the form.
  const parts = (contact?.name ?? '').split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(contact?.firstName ?? parts[0] ?? '');
  const [lastName, setLastName] = useState(contact?.lastName ?? parts.slice(1).join(' '));
  const [phone, setPhone] = useState(contact ? `+${contact.phone}` : '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [dob, setDob] = useState(contact?.dateOfBirth ?? '');
  const [fields, setFields] = useState<Array<{ key: string; value: string }>>(
    Object.entries(contact?.customFields ?? {}).map(([key, value]) => ({ key, value })),
  );
  const [groupIds, setGroupIds] = useState<string[]>(contact?.groupIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const customFields = Object.fromEntries(fields.filter((f) => f.key.trim() && f.value.trim()).map((f) => [f.key.trim(), f.value.trim()]));
    const body = {
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
      phone: phone.trim(),
      email: email.trim() || null,
      dateOfBirth: dob || null,
      customFields,
      groupIds,
    };
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-first" className={labelClass}>First name</label>
          <input id="c-first" required maxLength={60} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-last" className={labelClass}>Last name (optional)</label>
          <input id="c-last" maxLength={60} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="c-email" className={labelClass}>Email (optional)</label>
          <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="c-dob" className={labelClass}>Date of birth (optional)</label>
          <input id="c-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Custom fields (optional)</legend>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1 mb-2">
          Use them in messages, e.g. a field “Balance” becomes <code className="font-mono">{'{balance}'}</code>.
        </p>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label="Field name" placeholder="Field (e.g. Balance)" maxLength={40} value={f.key} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} className={cn(inputClass, 'flex-1')} />
              <input aria-label="Value" placeholder="Value" maxLength={200} value={f.value} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className={cn(inputClass, 'flex-1')} />
              <button type="button" aria-label="Remove field" onClick={() => setFields(fields.filter((_, j) => j !== i))} className="px-2 text-slate-500 hover:text-rose-600">✕</button>
            </div>
          ))}
          {fields.length < 20 && (
            <button type="button" onClick={() => setFields([...fields, { key: '', value: '' }])} className="text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
              + Add a field
            </button>
          )}
        </div>
      </fieldset>

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
                  aria-pressed={on}
                  onClick={() => setGroupIds(on ? groupIds.filter((x) => x !== g.id) : [...groupIds, g.id])}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                    on
                      ? 'bg-[#1764e0] border-[#1764e0] text-white'
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
// Import from CSV (with column mapping)
// ─────────────────────────────────────────────────────────────────────

const MAX_IMPORT_ROWS = 5000;

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
  const [table, setTable] = useState<ImportTable | null>(null);
  const [roles, setRoles] = useState<ColumnRole[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [groupId, setGroupId] = useState('');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setTable(null);
    setRoles([]);
    setFileName(null);
    setGroupId('');
    setUpdateExisting(false);
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
    if (file.size > 5 * 1024 * 1024) {
      setError('That file is larger than 5 MB. Split it into smaller files.');
      return;
    }
    const t = readImportTable(await file.text());
    if (t.rows.length === 0) {
      setError('That file has no rows.');
      return;
    }
    if (t.rows.length > MAX_IMPORT_ROWS) {
      setError(`That file has ${t.rows.length.toLocaleString()} rows. Import up to ${MAX_IMPORT_ROWS.toLocaleString()} at a time.`);
      return;
    }
    let guessed = t.headers.map(guessRole);
    if (!guessed.includes('phone')) {
      // No phone header: pick the most phone-like column; leave unnamed columns out.
      let best = 0;
      let bestScore = -1;
      t.headers.forEach((_, c) => {
        const score = t.rows.filter((r) => /^\+?[\d\s\-()]{7,}$/.test((r[c] ?? '').trim())).length;
        if (score > bestScore) [best, bestScore] = [c, score];
      });
      guessed = guessed.map((g, i) => (i === best ? 'phone' : t.hasHeader ? g : 'skip'));
    }
    setTable(t);
    setRoles(guessed);
    setFileName(file.name);
  };

  const rows = table ? mapImportRows(table, roles) : [];
  const phoneCount = roles.filter((r) => r === 'phone').length;
  const mappingError = table && phoneCount !== 1 ? 'Choose exactly one phone number column.' : null;

  const doImport = async () => {
    if (!table || mappingError) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<ImportResult>('/customer/contacts/import', {
        contacts: rows,
        groupId: groupId || undefined,
        updateExisting,
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
                  <span className="text-slate-500 dark:text-slate-400">{s.reason}</span>
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
            Upload a <strong>.csv</strong> file (Excel: File → Save As → CSV). Any column can be imported — first name,
            date of birth, balance, class, branch… — and used in messages as <code className="font-mono">{'{field}'}</code>.
          </p>
          <input ref={inputRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center hover:border-[#1764e0]"
          >
            <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400 mx-auto" strokeWidth={2} />
            <span className="block text-xs font-semibold text-[#1764e0] dark:text-blue-400 mt-2">
              {fileName ? `${fileName} — ${table?.rows.length.toLocaleString()} rows (choose another)` : 'Choose a CSV file'}
            </span>
          </button>

          {table && (
            <div>
              <div className={labelClass}>Match your columns</div>
              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                {table.headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{h}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        e.g. {table.rows.slice(0, 2).map((r) => r[i] || '—').join(', ')}
                      </div>
                    </div>
                    <label className="sr-only" htmlFor={`col-${i}`}>Import “{h}” as</label>
                    <select
                      id={`col-${i}`}
                      value={roles[i]}
                      onChange={(e) => setRoles(roles.map((r, j) => (j === i ? (e.target.value as ColumnRole) : r)))}
                      className={cn(inputClass, 'w-40 py-1.5 cursor-pointer')}
                    >
                      {(Object.keys(COLUMN_ROLE_LABELS) as ColumnRole[]).map((r) => (
                        <option key={r} value={r}>{r === 'custom' ? `Custom: {${h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}}` : COLUMN_ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {mappingError ? (
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1.5">{mappingError}</p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {rows.length.toLocaleString()} rows with a phone number. First: {rows.slice(0, 2).map((r) => [r.firstName ?? r.name, r.phone].filter(Boolean).join(' ')).join(' · ')}
                </p>
              )}
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
          <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="mt-0.5" />
            <span>
              Update contacts I already have with this file's details
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">Off: existing contacts only get blanks filled in and new custom fields.</span>
            </span>
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
            <button type="button" onClick={doImport} disabled={!table || !!mappingError || rows.length === 0 || busy} className={btnPrimary}>
              {busy && <Spinner />}
              Import {rows.length ? rows.length.toLocaleString() : ''} contacts
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
