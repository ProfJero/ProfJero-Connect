import { useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import type { Project, ProjectResponse } from '@profjero/shared';

interface Props {
  open: boolean;
  /** null/undefined = create mode; a project = edit mode */
  project?: Project | null;
  onClose: () => void;
  onSaved: (projectId: string) => void;
}

function ProjectFormModalForm({ open, project, onClose, onSaved }: Props) {
  const isEdit = !!project;

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [contactEmail, setContactEmail] = useState(project?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(project?.contactPhone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) errs.name = 'Project name is required.';
    else if (trimmedName.length > 100) errs.name = 'Max 100 characters.';

    if (description.length > 500) errs.description = 'Max 500 characters.';
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errs.contactEmail = 'Enter a valid email address.';
    }
    if (contactPhone.length > 30) errs.contactPhone = 'Max 30 characters.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const path = isEdit ? `/admin/projects/${project.id}` : '/admin/projects';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await apiFetch<ProjectResponse>(path, {
        method,
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });
      onSaved(res.project.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.requestId ? `${err.message} (${err.requestId})` : err.message,
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : isEdit
              ? 'Could not save changes.'
              : 'Could not create project.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Project' : 'Add Project'}
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <Field
          id="proj-name"
          label="Project Name"
          required
          value={name}
          onChange={setName}
          placeholder="e.g. GABS"
          error={fieldErrors.name}
          maxLength={100}
        />

        <Field
          id="proj-desc"
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="What is this project for?"
          error={fieldErrors.description}
          maxLength={500}
          multiline
        />

        <Field
          id="proj-email"
          label="Contact Email"
          type="email"
          value={contactEmail}
          onChange={setContactEmail}
          placeholder="ops@example.com"
          error={fieldErrors.contactEmail}
        />

        <Field
          id="proj-phone"
          label="Contact Phone"
          value={contactPhone}
          onChange={setContactPhone}
          placeholder="+233 24 123 4567"
          error={fieldErrors.contactPhone}
          maxLength={30}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-60 transition min-w-[120px]"
          >
            {submitting
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
                ? 'Save Changes'
                : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- small local field component, not exported ---

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  multiline?: boolean;
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = 'text',
  maxLength,
  multiline,
}: FieldProps) {
  const base =
    'w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ' +
    (error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/50'
      : 'border-slate-200 focus:border-[#1976d2] focus:ring-[#1976d2]/20');

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className={base + ' resize-none'}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={base}
        />
      )}
      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

/**
 * Mounted only while open, so every opening starts from a fresh form
 * (no state-reset effect needed).
 */
export function ProjectFormModal(props: Props) {
  return props.open ? <ProjectFormModalForm key={props.project?.id ?? 'new'} {...props} /> : null;
}
