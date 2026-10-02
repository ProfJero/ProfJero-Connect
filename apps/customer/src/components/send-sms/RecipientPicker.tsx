import { useDeferredValue, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Smartphone, Upload, Search, X, Users, FileText, type LucideIcon } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { parsePhoneList } from '../../lib/phone';
import { csvToContacts } from '../../lib/csv';
import { formatPhone } from '../../lib/format';
import { cn } from '../../lib/utils';
import { inputClass } from '../ui/buttons';
import { emptyRecipients, type RecipientDraft } from '../../lib/recipients';
import type { ContactGroup, ContactsResponse } from '../../lib/types';

type TabId = 'contacts' | 'manual' | 'upload';

const TABS: Array<{ id: TabId; title: string; description: string; icon: LucideIcon }> = [
  { id: 'contacts', title: 'Contacts & Groups', description: 'From your address book', icon: UserPlus },
  { id: 'manual', title: 'Enter Numbers', description: 'Type or paste numbers', icon: Smartphone },
  { id: 'upload', title: 'Upload File', description: 'CSV or TXT list', icon: Upload },
];

export function RecipientPicker({
  value,
  onChange,
  groups,
}: {
  value: RecipientDraft;
  onChange: (next: RecipientDraft) => void;
  groups: ContactGroup[];
}) {
  const [tab, setTab] = useState<TabId>('manual');

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg p-3 text-left shadow-xs flex items-start gap-2.5 transition-colors border',
                active
                  ? 'border-[#1a6cf0] bg-[#1a6cf0] text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', !active && 'text-slate-500 dark:text-slate-500')} strokeWidth={2} />
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-none">{t.title}</div>
                <div className={cn('text-[10px] mt-1', active ? 'text-white' : 'text-slate-500 dark:text-slate-500')}>
                  {t.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {tab === 'contacts' && <ContactsTab value={value} onChange={onChange} groups={groups} />}
      {tab === 'manual' && <ManualTab value={value} onChange={onChange} />}
      {tab === 'upload' && <UploadTab value={value} onChange={onChange} />}

      <SelectedChips value={value} onChange={onChange} groups={groups} />
    </div>
  );
}

function ContactsTab({
  value,
  onChange,
  groups,
}: {
  value: RecipientDraft;
  onChange: (next: RecipientDraft) => void;
  groups: ContactGroup[];
}) {
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q.trim());
  const search = useApi<ContactsResponse>(
    deferredQ ? `/customer/contacts?q=${encodeURIComponent(deferredQ)}&limit=8` : null,
  );
  const selectedIds = new Set(value.contacts.map((c) => c.id));

  const toggleGroup = (id: string) =>
    onChange({
      ...value,
      groupIds: value.groupIds.includes(id) ? value.groupIds.filter((g) => g !== id) : [...value.groupIds, id],
    });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Groups</div>
        {groups.length === 0 ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No groups yet.{' '}
            <Link to="/contacts/groups" className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline">
              Create a group
            </Link>{' '}
            to send to a list in one click.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = value.groupIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  disabled={g.contactCount === 0}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition disabled:opacity-50',
                    on
                      ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300',
                  )}
                >
                  <Users className="w-3 h-3" strokeWidth={2} />
                  {g.name}
                  <span className={cn('font-normal', on ? 'text-white' : 'text-slate-500 dark:text-slate-400')}>{g.contactCount}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Individual contacts</div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          <input
            className={cn(inputClass, 'pl-9')}
            placeholder="Search contacts by name or number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {deferredQ && (
          <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
            {search.loading && !search.data ? (
              <p className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">Searching…</p>
            ) : (search.data?.contacts ?? []).length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">No contacts match "{deferredQ}".</p>
            ) : (
              search.data!.contacts.map((c) => {
                const on = selectedIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        contacts: on ? value.contacts.filter((x) => x.id !== c.id) : [...value.contacts, c],
                      })
                    }
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">{formatPhone(c.phone)}</span>
                    </span>
                    <span className={cn('text-[11px] font-semibold shrink-0', on ? 'text-rose-500' : 'text-[#1764e0] dark:text-blue-400')}>
                      {on ? 'Remove' : 'Add'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ManualTab({ value, onChange }: { value: RecipientDraft; onChange: (next: RecipientDraft) => void }) {
  const parsed = parsePhoneList(value.manualText);
  return (
    <div>
      <textarea
        rows={5}
        value={value.manualText}
        onChange={(e) => onChange({ ...value, manualText: e.target.value })}
        placeholder={'0241234567\n+233201234567, 0551234567'}
        className={cn(inputClass, 'font-mono leading-relaxed resize-y')}
        aria-label="Phone numbers"
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400">
          One per line, or separated by commas. Local (024…) or international (+233…) format.
        </span>
        {parsed.valid.length > 0 && (
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{parsed.valid.length} valid</span>
        )}
        {parsed.invalid.length > 0 && (
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            {parsed.invalid.length} invalid: {parsed.invalid.slice(0, 3).join(', ')}
            {parsed.invalid.length > 3 ? '…' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function UploadTab({ value, onChange }: { value: RecipientDraft; onChange: (next: RecipientDraft) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setNote('That file is larger than 2 MB. Split it into smaller lists.');
      return;
    }
    const text = await file.text();
    const rows = csvToContacts(text);
    const { valid, invalid } = parsePhoneList(rows.map((r) => r.phone).join('\n'));
    onChange({ ...value, uploaded: valid, uploadedName: file.name });
    setNote(
      valid.length === 0
        ? 'No valid phone numbers found. Make sure the file has a column of numbers.'
        : `${valid.length} numbers loaded${invalid.length ? `, ${invalid.length} skipped as invalid` : ''}.`,
    );
  };

  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
      <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400 mx-auto" strokeWidth={1.75} />
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
        Upload a <strong>.csv</strong> or <strong>.txt</strong> file with one number per row. A header row such as
        "phone" or "mobile" is detected automatically.
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Excel files: use File → Save As → CSV first.</p>
      <input ref={inputRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <Upload className="w-3.5 h-3.5" strokeWidth={2} />
        Choose file
      </button>
      {note && <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">{note}</p>}
    </div>
  );
}

function SelectedChips({
  value,
  onChange,
  groups,
}: {
  value: RecipientDraft;
  onChange: (next: RecipientDraft) => void;
  groups: ContactGroup[];
}) {
  const manualCount = parsePhoneList(value.manualText).valid.length;
  const chips: Array<{ key: string; label: string; remove: () => void }> = [];

  if (manualCount > 0)
    chips.push({ key: 'manual', label: `${manualCount} typed number${manualCount === 1 ? '' : 's'}`, remove: () => onChange({ ...value, manualText: '' }) });
  if (value.uploaded.length > 0)
    chips.push({
      key: 'upload',
      label: `${value.uploaded.length} from ${value.uploadedName ?? 'file'}`,
      remove: () => onChange({ ...value, uploaded: [], uploadedName: null }),
    });
  for (const id of value.groupIds) {
    const g = groups.find((x) => x.id === id);
    chips.push({
      key: `g-${id}`,
      label: `${g?.name ?? 'Group'} (${g?.contactCount ?? 0})`,
      remove: () => onChange({ ...value, groupIds: value.groupIds.filter((x) => x !== id) }),
    });
  }
  for (const c of value.contacts) {
    chips.push({
      key: `c-${c.id}`,
      label: c.name,
      remove: () => onChange({ ...value, contacts: value.contacts.filter((x) => x.id !== c.id) }),
    });
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-500/10 text-[#1764e0] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
        >
          {chip.label}
          <button type="button" onClick={chip.remove} className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20" aria-label={`Remove ${chip.label}`}>
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange(emptyRecipients)}
        className="text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
