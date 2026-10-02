import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Notice } from '../ui/States';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useAccount } from '../../lib/account';

const senderIdMaxLength = 11;
const descriptionMinLength = 10;
const descriptionMaxLength = 500;

// Must match SenderIdPurposeSchema in packages/shared.
const purposeOptions = [
  'Business Notifications',
  'Marketing & Promotional',
  'Transactional & Alerts',
  'Authentication & OTP',
];

export function RequestForm({
  onSenderIdChange,
}: {
  onSenderIdChange?: (value: string) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useAccount();
  const [senderId, setSenderId] = useState('');
  const [purpose, setPurpose] = useState(purposeOptions[0]);
  const [orgName, setOrgName] = useState(user?.companyName ?? '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSenderIdChange = (value: string) => {
    // Letters, digits, spaces, hyphens, underscores only (network rule).
    const clean = value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '');
    setSenderId(clean);
    onSenderIdChange?.(clean);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (description.trim().length < descriptionMinLength) {
      setError(`Please describe how you'll use this Sender ID (at least ${descriptionMinLength} characters).`);
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/customer/sender-ids', {
        value: senderId.trim(),
        purpose,
        description: `${description.trim()}${orgName.trim() ? `\n\nOrganisation: ${orgName.trim()}` : ''}`.slice(0, descriptionMaxLength),
      });
      refreshNotifications();
      navigate('/messaging/sender-ids');
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sender ID */}
      <div>
        <label
          htmlFor="sender-id"
          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          Sender ID <span className="text-rose-500">*</span>
        </label>
        <input
          id="sender-id"
          type="text"
          required
          maxLength={senderIdMaxLength}
          value={senderId}
          onChange={(e) => handleSenderIdChange(e.target.value)}
          placeholder="e.g. YOURBRAND"
          className="w-full text-sm font-normal text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500"
        />
        <div className="flex justify-between items-center mt-1.5 text-xs text-slate-400 dark:text-slate-500 gap-3">
          <span>
            Letters, numbers and spaces. Use your business or brand name.
          </span>
          <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {senderId.length}/{senderIdMaxLength}
          </span>
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label
          htmlFor="purpose"
          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          Purpose <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <select
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full text-sm font-normal text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all outline-none appearance-none cursor-pointer"
          >
            {purposeOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 dark:text-slate-500">
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          Select the main purpose for this Sender ID.
        </p>
      </div>

      {/* Organisation name */}
      <div>
        <label
          htmlFor="org-name"
          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          Organisation / Business Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="org-name"
          type="text"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full text-sm font-normal text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all outline-none"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          Enter your organisation or business name.
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
        >
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          required
          minLength={descriptionMinLength}
          maxLength={descriptionMaxLength - 150}
          rows={4}
          placeholder="e.g. Appointment reminders and service updates to our registered customers."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm font-normal text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all outline-none resize-none leading-relaxed"
        />
        <div className="flex justify-between items-center mt-1 text-xs text-slate-400 dark:text-slate-500 gap-3">
          <span>Provide a brief description of how you will use this Sender ID.</span>
          <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {description.length}/{descriptionMaxLength - 150}
          </span>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-xs transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Submitting…</span>
            </>
          ) : (
            <span>Submit Request</span>
          )}
        </button>
        <Link
          to="/messaging/sender-ids"
          className="flex-1 text-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition duration-150"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}