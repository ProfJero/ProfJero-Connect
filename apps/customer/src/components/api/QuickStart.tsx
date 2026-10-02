import { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { PUBLIC_API_URL } from '../../lib/config';
import { cardClass } from '../ui/buttons';
import { cn } from '../../lib/utils';

type Lang = 'curl' | 'node' | 'python' | 'php';

function samples(base: string, senderId: string): Record<Lang, string> {
  const body = `{"recipients":["233241234567"],"message":"Hello from ProfJero Connect","senderId":"${senderId}"}`;
  return {
    curl: `curl -X POST ${base}/v1/sms/send \\
  -H "Authorization: Bearer $PROFJERO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: send-$(uuidgen)" \\
  -d '${body}'`,
    node: `// Node 18+ (built-in fetch). Run on your server only.
const res = await fetch('${base}/v1/sms/send', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PROFJERO_API_KEY}\`,
    'Content-Type': 'application/json',
    // Same key on retry = no double send.
    'Idempotency-Key': \`send-\${crypto.randomUUID()}\`,
  },
  body: JSON.stringify({
    recipients: ['233241234567'],
    message: 'Hello from ProfJero Connect',
    senderId: '${senderId}',
  }),
});
console.log(res.status, await res.json());`,
    python: `import os, uuid, requests

res = requests.post(
    "${base}/v1/sms/send",
    headers={
        "Authorization": f"Bearer {os.environ['PROFJERO_API_KEY']}",
        "Idempotency-Key": f"send-{uuid.uuid4()}",
    },
    json={
        "recipients": ["233241234567"],
        "message": "Hello from ProfJero Connect",
        "senderId": "${senderId}",
    },
    timeout=30,
)
print(res.status_code, res.json())`,
    php: `<?php
$ch = curl_init('${base}/v1/sms/send');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ' . getenv('PROFJERO_API_KEY'),
    'Content-Type: application/json',
    'Idempotency-Key: send-' . bin2hex(random_bytes(16)),
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'recipients' => ['233241234567'],
    'message' => 'Hello from ProfJero Connect',
    'senderId' => '${senderId}',
  ]),
]);
echo curl_exec($ch);`,
  };
}

const LABELS: Record<Lang, string> = { curl: 'cURL', node: 'Node.js', python: 'Python', php: 'PHP' };

/** Copy-paste examples against the real /v1 API (docs/api.md). */
export function QuickStart({ senderId }: { senderId: string | null }) {
  const [lang, setLang] = useState<Lang>('curl');
  const [copied, setCopied] = useState(false);
  const code = samples(PUBLIC_API_URL || 'https://YOUR-API-URL', senderId ?? 'YOURSENDER')[lang];

  return (
    <section className={cn(cardClass, 'overflow-hidden')}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#1764e0] dark:text-blue-400" strokeWidth={2} />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick start — send an SMS</h2>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Base URL <code className="font-mono">{PUBLIC_API_URL || '—'}</code>. Other endpoints:{' '}
          <code className="font-mono">GET /v1/wallet</code>, <code className="font-mono">GET /v1/sms/batches/:id</code>,{' '}
          <code className="font-mono">GET /v1/sender-ids</code>. Units, Sender IDs and history are shared with this dashboard.
        </p>
      </div>
      <div className="px-5 pt-3 flex gap-1 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
        {(Object.keys(LABELS) as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLang(l);
              setCopied(false);
            }}
            className={cn(
              'px-3 py-2 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap',
              lang === l ? 'border-[#1a6cf0] text-[#1764e0] dark:text-blue-400' : 'border-transparent text-slate-500',
            )}
          >
            {LABELS[l]}
          </button>
        ))}
      </div>
      <div className="relative">
        <pre tabIndex={0} aria-label="Code example" className="bg-slate-900 text-slate-100 text-[11px] leading-relaxed p-4 overflow-x-auto font-mono">{code}</pre>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
            } catch {
              /* ignore */
            }
          }}
          className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="px-5 py-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          <strong>201</strong> = accepted (check per-recipient status in the response) · <strong>402</strong> = not enough
          units · <strong>400</strong> = invalid request or Sender ID not approved · <strong>409</strong> = Idempotency-Key reused
          with a different body.
        </p>
        <p>Every error includes a <code className="font-mono">requestId</code> — quote it when contacting support.</p>
      </div>
    </section>
  );
}
