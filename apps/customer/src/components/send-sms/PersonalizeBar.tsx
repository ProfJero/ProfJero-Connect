import { useState } from 'react';
import { Braces, FileText, Save, ChevronDown } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import { FIELD_LABELS } from '../../lib/fields';

const label = (key: string) => FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

interface Template {
  id: string;
  name: string;
  body: string;
}

/**
 * Personalisation tools above the message box: insert a contact field
 * ({first_name}…), load a saved template, or save the current message.
 */
export function PersonalizeBar({
  message,
  onInsert,
  onUseTemplate,
}: {
  message: string;
  onInsert: (token: string) => void;
  onUseTemplate: (body: string) => void;
}) {
  const fields = useApi<{ builtin: string[]; custom: string[] }>('/customer/contacts/fields');
  const templates = useApi<{ templates: Template[] }>('/customer/templates');
  const [open, setOpen] = useState<'fields' | 'templates' | null>(null);
  const [saveState, setSaveState] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null });

  const saveTemplate = async () => {
    const name = window.prompt('Name this template (e.g. "Payment reminder")');
    if (!name?.trim()) return;
    setSaveState({ busy: true, note: null });
    try {
      await api.post('/customer/templates', { name: name.trim(), body: message });
      templates.refresh();
      setSaveState({ busy: false, note: 'Saved' });
    } catch (err) {
      setSaveState({ busy: false, note: errorMessage(err) });
    }
  };

  const menuBtn = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <div className="relative">
        <button type="button" className={menuBtn} aria-expanded={open === 'fields'} aria-haspopup="menu" onClick={() => setOpen(open === 'fields' ? null : 'fields')}>
          <Braces className="w-3.5 h-3.5" /> Insert field <ChevronDown className="w-3 h-3" />
        </button>
        {open === 'fields' && (
          <div role="menu" className="absolute z-20 mt-1 w-60 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1">
            <MenuHeading>Contact details</MenuHeading>
            {(fields.data?.builtin ?? Object.keys(FIELD_LABELS)).map((f) => (
              <MenuItem key={f} onClick={() => { onInsert(`{${f}}`); setOpen(null); }} label={label(f)} token={`{${f}}`} />
            ))}
            {(fields.data?.custom.length ?? 0) > 0 && <MenuHeading>Your custom fields</MenuHeading>}
            {fields.data?.custom.map((f) => (
              <MenuItem key={f} onClick={() => { onInsert(`{${f}}`); setOpen(null); }} label={label(f)} token={`{${f}}`} />
            ))}
            <p className="px-2.5 py-2 text-[10px] text-slate-500 dark:text-slate-400 leading-snug border-t border-slate-100 dark:border-slate-800 mt-1">
              Add a fallback for contacts without a value: <code className="font-mono">{'{first_name|Customer}'}</code>. Custom fields come from your contacts and CSV imports.
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <button type="button" className={menuBtn} aria-expanded={open === 'templates'} aria-haspopup="menu" onClick={() => setOpen(open === 'templates' ? null : 'templates')}>
          <FileText className="w-3.5 h-3.5" /> Use template <ChevronDown className="w-3 h-3" />
        </button>
        {open === 'templates' && (
          <div role="menu" className="absolute z-20 mt-1 w-72 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1">
            {(templates.data?.templates.length ?? 0) === 0 ? (
              <p className="px-2.5 py-3 text-[11px] text-slate-500 dark:text-slate-400">No saved templates yet. Write a message and choose “Save as template”.</p>
            ) : (
              templates.data!.templates.map((t) => (
                <button
                  key={t.id}
                  role="menuitem"
                  type="button"
                  onClick={() => { onUseTemplate(t.body); setOpen(null); }}
                  className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{t.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.body}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button type="button" className={cn(menuBtn, 'disabled:opacity-50')} disabled={!message.trim() || saveState.busy} onClick={saveTemplate}>
        <Save className="w-3.5 h-3.5" /> Save as template
      </button>
      {saveState.note && <span role="status" className="text-[11px] text-slate-500 dark:text-slate-400">{saveState.note}</span>}
    </div>
  );
}

function MenuHeading({ children }: { children: string }) {
  return <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</div>;
}

function MenuItem({ label, token, onClick }: { label: string; token: string; onClick: () => void }) {
  return (
    <button role="menuitem" type="button" onClick={onClick} className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
      <span>{label}</span>
      <code className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{token}</code>
    </button>
  );
}
