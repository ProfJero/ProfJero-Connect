import { useDeferredValue, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Upload, Users, UsersRound, Search, Pencil, Trash2, Mail, CalendarPlus, Send } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { TableScroll } from '../../components/ui/TableScroll';
import { EmptyState, ErrorState, Notice, SkeletonRows, Spinner } from '../../components/ui/States';
import { ConfirmModal } from '../../components/ui/Modal';
import { ContactFormModal, ImportContactsModal } from '../../components/contacts/ContactModals';
import { btnPrimary, btnSecondary, cardClass, inputClass } from '../../components/ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate, formatPhone } from '../../lib/format';
import { GROUP_COLORS } from '../../lib/groupColors';
import { cn } from '../../lib/utils';
import type { Contact, ContactGroup, ContactsResponse } from '../../lib/types';

const PAGE_SIZE = 25;

export function ContactsPage() {
  const [params, setParams] = useSearchParams();
  const groupFilter = params.get('group') ?? '';
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q.trim());
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<Contact | null | 'new'>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (deferredQ) qs.set('q', deferredQ);
  if (groupFilter) qs.set('groupId', groupFilter);
  const list = useApi<ContactsResponse>(`/customer/contacts?${qs}`);
  const groupsRes = useApi<{ groups: ContactGroup[] }>('/customer/contact-groups');
  const groups = groupsRes.data?.groups ?? [];
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const refreshAll = () => {
    list.refresh();
    groupsRes.refresh();
    setSelected(new Set());
  };

  const contacts = list.data?.contacts ?? [];
  const total = list.data?.total ?? 0;
  const stats = list.data?.stats;
  const allOnPageSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id));

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post('/customer/contacts/delete', { ids: deleting });
      setNotice(`${deleting.length} contact${deleting.length === 1 ? '' : 's'} deleted.`);
      setDeleting(null);
      setOffset(0);
      refreshAll();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addSelectedToGroup = async (groupId: string) => {
    if (!groupId || selected.size === 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await api.post<{ changed: number }>(`/customer/contact-groups/${encodeURIComponent(groupId)}/members`, {
        contactIds: [...selected],
      });
      setNotice(`${res.changed} contact${res.changed === 1 ? '' : 's'} added to ${groupById.get(groupId)?.name ?? 'group'}.`);
      refreshAll();
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const setGroupFilter = (id: string) => {
    setOffset(0);
    setSelected(new Set());
    setParams(id ? { group: id } : {});
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <PageHeader
        icon={Users}
        title="Contacts"
        subtitle="The people and customers you message."
        actions={
          <>
            <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add Contact
            </button>
            <button type="button" onClick={() => setImportOpen(true)} className={btnSecondary}>
              <Upload className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
              Import CSV
            </button>
            <Link to="/contacts/groups" className={btnSecondary}>
              <UsersRound className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
              Groups
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total contacts" value={stats?.total} />
        <Stat icon={UsersRound} label="In at least one group" value={stats?.inGroups} />
        <Stat icon={Mail} label="With email" value={stats?.withEmail} />
        <Stat icon={CalendarPlus} label="Added in last 30 days" value={stats?.addedLast30Days} />
      </section>

      <section className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          <input
            className={cn(inputClass, 'pl-9 py-2.5')}
            placeholder="Search by name, number or email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className={cn(inputClass, 'sm:w-56 cursor-pointer py-2.5')}
          aria-label="Filter by group"
        >
          <option value="">All contacts</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.contactCount})
            </option>
          ))}
        </select>
      </section>

      {notice && <Notice tone="info">{notice}</Notice>}

      {selected.size > 0 && (
        <section className="flex flex-wrap items-center gap-3 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-2.5 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{selected.size} selected</span>
          {groups.length > 0 && (
            <select
              value=""
              disabled={busy}
              onChange={(e) => addSelectedToGroup(e.target.value)}
              className={cn(inputClass, 'w-auto py-1.5 cursor-pointer')}
              aria-label="Add selected to group"
            >
              <option value="">Add to group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => setDeleting([...selected])} className="text-rose-600 dark:text-rose-400 font-semibold hover:underline">
            Delete
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-slate-500 hover:underline ml-auto">
            Clear selection
          </button>
          {busy && <Spinner className="text-slate-400" />}
        </section>
      )}

      <section className={cn(cardClass, 'overflow-hidden')}>
        {list.loading && !list.data ? (
          <SkeletonRows rows={8} />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.refresh} />
        ) : contacts.length === 0 ? (
          deferredQ || groupFilter ? (
            <p className="px-5 py-10 text-center text-xs text-slate-500 dark:text-slate-400">No contacts match.</p>
          ) : (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Add people one by one or import a CSV from your spreadsheet. You can then message a whole group in one go."
              action={
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>Add contact</button>
                  <button type="button" onClick={() => setImportOpen(true)} className={btnSecondary}>Import CSV</button>
                </div>
              }
            />
          )
        ) : (
          <>
            <TableScroll>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 pl-5 pr-2 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        checked={allOnPageSelected}
                        onChange={() => {
                          const next = new Set(selected);
                          for (const c of contacts) {
                            if (allOnPageSelected) next.delete(c.id);
                            else next.add(c.id);
                          }
                          setSelected(next);
                        }}
                      />
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap">Name</th>
                    <th className="py-3 px-3 whitespace-nowrap">Phone</th>
                    <th className="py-3 px-3 whitespace-nowrap">Email</th>
                    <th className="py-3 px-3 whitespace-nowrap">Groups</th>
                    <th className="py-3 px-3 whitespace-nowrap">Added</th>
                    <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                  {contacts.map((c) => (
                    <tr key={c.id} className={cn('hover:bg-slate-50/70 dark:hover:bg-slate-800/50', selected.has(c.id) && 'bg-blue-50/40 dark:bg-blue-500/5')}>
                      <td className="py-3 pl-5 pr-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${c.name}`}
                          checked={selected.has(c.id)}
                          onChange={() => {
                            const next = new Set(selected);
                            if (next.has(c.id)) next.delete(c.id);
                            else next.add(c.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{c.name}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{formatPhone(c.phone)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{c.email ?? '—'}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {c.groupIds.map((id) => {
                            const g = groupById.get(id);
                            if (!g) return null;
                            return (
                              <span key={id} className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', GROUP_COLORS[g.color].bg, GROUP_COLORS[g.color].text)}>
                                {g.name}
                              </span>
                            );
                          })}
                          {c.groupIds.length === 0 && '—'}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button type="button" onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`Edit ${c.name}`}>
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                        <button type="button" onClick={() => setDeleting([c.id])} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500" aria-label={`Delete ${c.name}`}>
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing {offset + 1}–{offset + contacts.length} of {total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                {groupFilter && (
                  <Link to="/messaging/sms" state={{ groupIds: [groupFilter] }} className={btnSecondary}>
                    <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
                    Message this group
                  </Link>
                )}
                <button type="button" className={btnSecondary} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                  Previous
                </button>
                <button type="button" className={btnSecondary} disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ContactFormModal
        open={editing !== null}
        contact={editing === 'new' ? null : editing}
        groups={groups}
        onClose={() => setEditing(null)}
        onSaved={refreshAll}
      />
      <ImportContactsModal open={importOpen} groups={groups} onClose={() => setImportOpen(false)} onImported={refreshAll} />
      <ConfirmModal
        open={deleting !== null}
        title={deleting && deleting.length > 1 ? `Delete ${deleting.length} contacts?` : 'Delete contact?'}
        message="This removes them from your contacts and every group. Your message history is not affected."
        confirmLabel="Delete"
        busy={busy}
        error={actionError}
        onConfirm={doDelete}
        onClose={() => {
          setDeleting(null);
          setActionError(null);
        }}
      />
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | undefined }) {
  return (
    <div className={cn(cardClass, 'p-4 flex items-center gap-3')}>
      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</div>
        <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {value === undefined ? '—' : value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
