import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Shield, AlertCircle } from 'lucide-react';
import { ApiKeysTable } from '../../components/api-keys/ApiKeysTable';
import { CreateSecretKeyModal } from '../../components/api-keys/CreateSecretKeyModal';
import { CreatePublishableKeyModal } from '../../components/api-keys/CreatePublishableKeyModal';
import { PlaintextRevealModal } from '../../components/api-keys/PlaintextRevealModal';
import { useApi } from '../../lib/useApi';
import type {
  ApiKeyCreateResponse,
  ApiKeyListResponse,
  ProjectResponse,
} from '@profjero/shared';

type RevealState = {
  plaintext: string;
  keyName: string;
  kind: 'secret' | 'publishable';
  warning: string | null;
} | null;

export function ApiKeysPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const projectApi = useApi<ProjectResponse>(
    id ? `/admin/projects/${id}` : null,
  );
  const keysApi = useApi<ApiKeyListResponse>(
    id ? `/admin/projects/${id}/api-keys` : null,
  );

  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [publishableModalOpen, setPublishableModalOpen] = useState(false);
  const [reveal, setReveal] = useState<RevealState>(null);

  if (!id) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1">
        <div className="text-sm text-slate-500">No project ID in the URL.</div>
      </main>
    );
  }

  const project = projectApi.data?.project;
  const keys = keysApi.data?.apiKeys ?? [];

  const handleCreated = (resp: ApiKeyCreateResponse) => {
    setSecretModalOpen(false);
    setPublishableModalOpen(false);
    setReveal({
      plaintext: resp.apiKey.plaintext,
      keyName: resp.apiKey.name,
      kind: resp.apiKey.kind,
      warning: resp.warning,
    });
    keysApi.reload();
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <button
        onClick={() => navigate(`/projects/${id}`)}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1976d2] transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Project
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <Key className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              API Keys
            </h2>
            <p className="text-xs text-slate-500">
              {project ? (
                <>
                  For <span className="font-semibold">{project.name}</span> —
                  manage credentials for backend and browser clients.
                </>
              ) : (
                'Manage credentials for backend and browser clients.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSecretModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
            Create secret key
          </button>
          <button
            type="button"
            onClick={() => setPublishableModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition"
          >
            <Key className="w-3.5 h-3.5" strokeWidth={2} />
            Create publishable key
          </button>
        </div>
      </div>

      {keysApi.error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load API keys.</div>
            <div className="mt-0.5 opacity-80">{keysApi.error.message}</div>
          </div>
          <button
            onClick={() => keysApi.reload()}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <ApiKeysTable
        apiKeys={keys}
        loading={keysApi.loading && !keysApi.data}
        onChanged={() => keysApi.reload()}
      />

      {id && (
        <>
          <CreateSecretKeyModal
            open={secretModalOpen}
            projectId={id}
            onClose={() => setSecretModalOpen(false)}
            onCreated={handleCreated}
          />
          <CreatePublishableKeyModal
            open={publishableModalOpen}
            projectId={id}
            onClose={() => setPublishableModalOpen(false)}
            onCreated={handleCreated}
          />
        </>
      )}

      <PlaintextRevealModal
        open={reveal !== null}
        keyName={reveal?.keyName ?? ''}
        kind={reveal?.kind ?? 'secret'}
        plaintext={reveal?.plaintext ?? ''}
        warning={reveal?.warning}
        onClose={() => setReveal(null)}
      />
    </main>
  );
}