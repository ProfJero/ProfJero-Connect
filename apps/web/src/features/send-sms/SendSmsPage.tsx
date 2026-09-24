import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import {
  WizardBar,
  type WizardStep,
} from '../../components/send-sms/WizardBar';
import { StepProjectSelect } from '../../components/send-sms/StepProjectSelect';
import { StepCompose } from '../../components/send-sms/StepCompose';
import { StepReview } from '../../components/send-sms/StepReview';
import { SuccessPanel } from '../../components/send-sms/SuccessPanel';
import { SendSmsSidebar } from '../../components/send-sms/SendSmsSidebar';
import { useApi } from '../../lib/useApi';
import { apiFetch, ApiError } from '../../lib/api';
import type {
  ProjectListResponse,
  ProjectSenderIdListResponse,
  SendSmsResponse,
  WalletDetailResponse,
} from '@profjero/shared';

type SendState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; response: SendSmsResponse }
  | { kind: 'error'; message: string };

export function SendSmsPage() {
  const projectsApi = useApi<ProjectListResponse>('/admin/projects');

  const [step, setStep] = useState<WizardStep>(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [senderId, setSenderId] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [message, setMessage] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>({ kind: 'idle' });

  const walletApi = useApi<WalletDetailResponse>(
    projectId ? `/admin/wallets/${projectId}` : null,
  );
  const senderIdsApi = useApi<ProjectSenderIdListResponse>(
    projectId ? `/admin/projects/${projectId}/sender-ids` : null,
  );

  const projects = projectsApi.data?.projects ?? [];
  const project = projects.find((p) => p.id === projectId) ?? null;
  const wallet = walletApi.data?.wallet ?? null;
  const senderIds = senderIdsApi.data?.senderIds ?? [];

  // When the project changes, clear the sender selection.
  const handleProjectChange = (id: string) => {
    setProjectId(id);
    setSenderId('');
  };

  // Auto-select the first approved Sender ID whenever the list arrives for a
  // newly selected project. Ref prevents re-running on every render.
  const lastAutoSelectProjectRef = useRef<string | null>(null);
  useEffect(() => {
    if (!projectId) return;
    if (lastAutoSelectProjectRef.current === projectId) return;
    if (senderIdsApi.loading) return;

    const first = senderIds.find((s) => s.status === 'approved');
    if (first) {
      setSenderId(first.senderId);
      lastAutoSelectProjectRef.current = projectId;
    } else {
      // Mark this project as "attempted" even if nothing was auto-selected,
      // so we don't re-check on every subsequent render.
      lastAutoSelectProjectRef.current = projectId;
    }
  }, [projectId, senderIds, senderIdsApi.loading]);

  const recipients = useMemo(
    () =>
      recipientsText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    [recipientsText],
  );

  const handleContinueFromProject = () => setStep(2);

  const handleContinueFromCompose = () => {
    setIdempotencyKey(crypto.randomUUID());
    setStep(3);
  };

  const handleBackToProject = () => setStep(1);
  const handleBackToCompose = () => setStep(2);

  const handleSend = async () => {
    if (!projectId || !idempotencyKey || !senderId) return;
    setSendState({ kind: 'sending' });
    try {
      const resp = await apiFetch<SendSmsResponse>(
        `/admin/projects/${projectId}/sms/send`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({
            recipients,
            message: message.trim(),
            senderId: senderId.trim(),
          }),
        },
      );
      setSendState({ kind: 'sent', response: resp });
      walletApi.reload();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.requestId
            ? `${err.message} (${err.requestId})`
            : err.message
          : err instanceof Error
            ? err.message
            : 'Send failed.';
      setSendState({ kind: 'error', message: msg });
    }
  };

  const handleReset = () => {
    setStep(1);
    setProjectId(null);
    setSenderId('');
    setRecipientsText('');
    setMessage('');
    setIdempotencyKey(null);
    setSendState({ kind: 'idle' });
    lastAutoSelectProjectRef.current = null;
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Send className="w-5 h-5 -rotate-45" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Send SMS
            </h1>
            <p className="text-xs text-slate-500">
              Send SMS messages to your recipients quickly and easily.
            </p>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2} />
          <div className="text-xs text-slate-600 min-w-0">
            <span className="font-semibold text-slate-800">Need help?</span>{' '}
            <span>Contact support for assistance.</span>
          </div>
        </div>
      </div>

      {sendState.kind !== 'sent' && <WizardBar currentStep={step} />}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
        {sendState.kind === 'sent' ? (
          <SuccessPanel
            response={sendState.response}
            onSendAnother={handleReset}
          />
        ) : step === 1 ? (
          <StepProjectSelect
            projects={projects}
            projectId={projectId}
            onProjectChange={handleProjectChange}
            senderId={senderId}
            onSenderIdChange={setSenderId}
            senderIds={senderIds}
            senderIdsLoading={senderIdsApi.loading}
            wallet={wallet}
            walletLoading={walletApi.loading}
            onNext={handleContinueFromProject}
          />
        ) : step === 2 ? (
          <StepCompose
            recipientsText={recipientsText}
            onRecipientsChange={setRecipientsText}
            message={message}
            onMessageChange={setMessage}
            recipientCount={recipients.length}
            onBack={handleBackToProject}
            onNext={handleContinueFromCompose}
          />
        ) : (
          <StepReview
            project={project}
            senderId={senderId}
            recipients={recipients}
            message={message}
            walletAvailable={wallet?.availableUnits ?? 0}
            sending={sendState.kind === 'sending'}
            error={sendState.kind === 'error' ? sendState.message : null}
            onBack={handleBackToCompose}
            onSend={handleSend}
          />
        )}

        <SendSmsSidebar
          project={project}
          senderId={senderId}
          recipientCount={recipients.length}
          message={message}
          wallet={wallet}
        />
      </div>
    </main>
  );
}