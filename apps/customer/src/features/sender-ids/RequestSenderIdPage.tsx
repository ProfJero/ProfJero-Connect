import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RequestForm } from '../../components/sender-ids/RequestForm';
import {
  RequirementsCard,
  PreviewCard,
} from '../../components/sender-ids/RequirementsAndPreview';
import { requestFormDefaults } from '../../mock/requestSenderId';

export function RequestSenderIdPage() {
  // Live-updated sender ID for the preview card
  const [previewValue, setPreviewValue] = useState(requestFormDefaults.senderId);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 flex-1 max-w-[1400px] w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/messaging/sender-ids"
            className="text-[#1a6cf0] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
            title="Go back"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Request Sender ID
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-9">
          Submit a request for a Sender ID. Our team will review and register it before
          activation.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-7">
          <RequestForm onSenderIdChange={setPreviewValue} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-6">
          <RequirementsCard />
          <PreviewCard senderId={previewValue} />
        </div>
      </div>
    </main>
  );
}