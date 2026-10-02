import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Calendar, Pencil, Trash2, Send, UsersRound } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { ConfirmModal } from '../../components/ui/Modal';
import { GroupFormModal } from '../../components/contacts/ContactModals';
import { btnPrimary, cardClass, inputClass } from '../../components/ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';
import { GROUP_COLORS } from '../../lib/groupColors';
import { cn } from '../../lib/utils';
import type { ContactGroup } from '../../lib/types';

export function ContactGroupsPage() {
  const { data, loading, error, refresh } = useApi<{ groups: ContactGroup[] }>('/customer/contact-groups');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ContactGroup | null | 'new'>(null);
  const [deleting, setDeleting] = useState<ContactGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const groups = (data?.groups ?? []).filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()));

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await api.del(`/customer/contact-groups/${encodeURIComponent(deleting.id)}`);
      setDeleting(null);
      refresh();
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
      <PageHeader
        icon={UsersRound}
        title="Contact Groups"
        subtitle="Organise contacts into lists you can message in one click."
        actions={
          <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Create Group
          </button>
        }
      />

      {(data?.groups.length ?? 0) > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
          <input className={cn(inputClass, 'pl-9 py-2.5')} placeholder="Search groups…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {loading && !data ? (
        <div className={cardClass}>
          <SkeletonRows />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} className="m-0" />
      ) : (data?.groups.length ?? 0) === 0 ? (
        <div className={cardClass}>
          <EmptyState
            icon={UsersRound}
            title="No groups yet"
            description="Groups let you send to everyone on a list — customers, staff, members — in one click."
            action={
              <button type="button" onClick={() => setEditing('new')} className={btnPrimary}>
                Create your first group
              </button>
            }
          />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => {
            const color = GROUP_COLORS[g.color];
            return (
              <div key={g.id} className={cn(cardClass, 'p-5 flex flex-col justify-between')}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', color.bg, color.text)}>
                        <Users className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{g.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {g.contactCount.toLocaleString()} contact{g.contactCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <button type="button" onClick={() => setEditing(g)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" aria-label={`Edit ${g.name}`}>
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button type="button" onClick={() => setDeleting(g)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500" aria-label={`Delete ${g.name}`}>
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-4">
                    <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    Updated {formatDate(g.updatedAt)}
                  </div>
                  {g.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-3">{g.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/contacts?group=${encodeURIComponent(g.id)}`}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    View contacts
                  </Link>
                  {g.contactCount > 0 && (
                    <Link
                      to="/messaging/sms"
                      state={{ groupIds: [g.id] }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a6cf0] hover:bg-[#155cd0] text-xs font-semibold text-white"
                    >
                      <Send className="w-3.5 h-3.5 -rotate-45" strokeWidth={2} />
                      Message
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No groups match "{q}".</p>}
        </section>
      )}

      <GroupFormModal open={editing !== null} group={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />
      <ConfirmModal
        open={deleting !== null}
        title={`Delete "${deleting?.name ?? ''}"?`}
        message="The group is removed. Its contacts stay in your address book."
        confirmLabel="Delete group"
        busy={busy}
        error={deleteError}
        onConfirm={doDelete}
        onClose={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
      />
    </main>
  );
}
