import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Copy, KeyRound, BookOpen } from 'lucide-react';
import { BrandMark } from '../../components/brand/BrandMark';
import { PUBLIC_API_URL } from '../../lib/config';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';

/**
 * Public API documentation (/developers). No sign-in needed, so
 * integrators — and search engines — can read it before signing up.
 * Example responses were captured from the real API.
 */

const BASE = PUBLIC_API_URL || 'https://profjero-sms-api-prod.amoakob947.workers.dev';

type Lang = 'curl' | 'node' | 'python' | 'php';
const LANGS: Array<[Lang, string]> = [['curl', 'cURL'], ['node', 'Node.js'], ['python', 'Python'], ['php', 'PHP']];

const TOC: Array<[string, string, Array<[string, string]>?]> = [
  ['intro', 'Introduction'],
  ['auth', 'Authentication'],
  ['idempotency', 'Idempotency'],
  ['errors', 'Errors & limits'],
  ['balance', 'Balance', [['get-balance', 'GET /v1/balance'], ['get-wallet', 'GET /v1/wallet'], ['get-transactions', 'GET /v1/wallet/transactions']]],
  ['sms', 'Sending SMS', [['send', 'POST /v1/sms/send'], ['personalise', 'Personalised messages'], ['schedule', 'Scheduling'], ['estimate', 'POST /v1/sms/estimate'], ['batches', 'GET /v1/sms/batches'], ['batch', 'GET /v1/sms/batches/:id'], ['statuses', 'Message statuses']]],
  ['payments', 'Payments (top up)', [['create-payment', 'POST /v1/payments'], ['get-payment', 'GET /v1/payments/:reference'], ['list-payments', 'GET /v1/payments']]],
  ['campaigns', 'Scheduled sends', [['list-campaigns', 'GET /v1/campaigns'], ['cancel-campaign', 'POST /v1/campaigns/:id/cancel']]],
  ['sender-ids', 'Sender IDs'],
  ['public', 'Public endpoints'],
  ['billing', 'Pages & billing'],
];

export function DevelopersPage() {
  const { isAuthenticated } = useAuth();
  const [lang, setLang] = useState<Lang>('curl');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <BrandMark className="w-8 h-8" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">ProfJero Connect</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-[11px] font-semibold text-[#1764e0] dark:text-blue-300">API docs</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/api" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Sign in</Link>
            )}
            <Link to={isAuthenticated ? '/api' : '/signup'} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1764e0] hover:bg-[#155cd0] text-white text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5" /> {isAuthenticated ? 'Get API keys' : 'Create free account'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-20 text-xs space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            {TOC.map(([id, label, children]) => (
              <div key={id}>
                <a href={`#${id}`} className="block py-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-[#1764e0]">{label}</a>
                {children?.map(([cid, clabel]) => (
                  <a key={cid} href={`#${cid}`} className="block py-0.5 pl-3 text-slate-500 dark:text-slate-400 hover:text-[#1764e0] font-mono text-[11px]">{clabel}</a>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 max-w-3xl space-y-12">
          <section id="intro" className="scroll-mt-20">
            <div className="flex items-center gap-2 text-[#1764e0] dark:text-blue-400 text-xs font-semibold"><BookOpen className="w-4 h-4" /> Developer documentation</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">ProfJero Connect SMS API</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Send single, bulk and personalised SMS from your website, app or system; schedule messages; check your balance;
              and top up your wallet — all over a simple JSON REST API. Everything you can do in the dashboard shares the
              same wallet, Sender IDs and message history.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <Fact label="Base URL"><code className="font-mono break-all">{BASE}</code></Fact>
              <Fact label="Format">JSON over HTTPS</Fact>
              <Fact label="Phone numbers">Ghana numbers: <code className="font-mono">0241234567</code> or <code className="font-mono">233241234567</code></Fact>
            </div>
            <ol className="mt-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5">
              <li><Link className="text-[#1764e0] underline" to="/signup">Create an account</Link> and request a Sender ID (the name recipients see).</li>
              <li>Create a secret API key in <strong>API &amp; Integrations</strong>. Keep it on your server.</li>
              <li>Top up units, then call <code className="font-mono">POST /v1/sms/send</code>.</li>
            </ol>
          </section>

          <Section id="auth" title="Authentication">
            <p>Send your API key as a Bearer token on every request:</p>
            <Code>{`Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Secret keys</strong> (<code className="font-mono">pk_live_…</code>) can do everything below. Use them only on servers — never in a browser or mobile app.</li>
              <li><strong>Publishable keys</strong> (<code className="font-mono">pub_live_…</code>, issued by the operator) are limited to sending to an allow-list of numbers, with rate limits and a spending cap. They can't read balances, top up or schedule.</li>
              <li>A revoked or expired key stops working immediately with <code className="font-mono">401</code>.</li>
            </ul>
          </Section>

          <Section id="idempotency" title="Idempotency">
            <p>
              Requests that send or charge (<code className="font-mono">POST /v1/sms/send</code>, <code className="font-mono">POST /v1/payments</code>) require an{' '}
              <code className="font-mono">Idempotency-Key</code> header (8–120 characters). Retrying with the same key returns the original
              result instead of sending or charging twice. Reusing a key with a <em>different</em> request returns <code className="font-mono">409</code>.
            </p>
            <Code>{`Idempotency-Key: order-1042-ready`}</Code>
            <p className="text-slate-500 dark:text-slate-400">Tip: derive the key from your own record (e.g. the order ID), so a crash-and-retry can never double-send.</p>
          </Section>

          <Section id="errors" title="Errors & limits">
            <p>Errors share one shape. Quote <code className="font-mono">requestId</code> when you contact support.</p>
            <Code>{`{
  "error": {
    "code": "http_402",
    "message": "Insufficient units. Top up your wallet (POST /v1/payments) and retry.",
    "requestId": "a549bf07-c949-4cd9-b997-25109ea2a322"
  }
}`}</Code>
            <Table
              head={['Status', 'Meaning']}
              rows={[
                ['400', 'Invalid input — the message says which field.'],
                ['401', 'Missing, invalid, revoked or expired API key.'],
                ['402', 'Not enough units in your wallet. Nothing was sent.'],
                ['403', "The key can't do this (e.g. publishable key), the Sender ID isn't approved for you, or your account is suspended."],
                ['404', "Not found (or it belongs to another account)."],
                ['409', 'Idempotency-Key reused with a different request, or a state conflict.'],
                ['429', 'Too many requests. Wait for the Retry-After seconds, then retry.'],
                ['5xx', 'Something went wrong on our side. Safe to retry with the same Idempotency-Key.'],
              ]}
            />
          </Section>

          <Section id="balance" title="Balance">
            <Endpoint id="get-balance" method="GET" path="/v1/balance" summary="Units you can spend right now — the quickest check before sending.">
              <Code>{`curl ${BASE}/v1/balance -H "Authorization: Bearer $PROFJERO_API_KEY"`}</Code>
              <Response>{`{
  "availableUnits": 1000,
  "lowBalance": false,
  "updatedAt": "2026-10-04T05:06:36.251Z"
}`}</Response>
            </Endpoint>
            <Endpoint id="get-wallet" method="GET" path="/v1/wallet" summary="Full wallet: available, reserved (held for messages in flight) and your low-balance level.">
              <Response>{`{
  "availableUnits": 999,
  "reservedUnits": 0,
  "totalUnits": 999,
  "lowBalanceThreshold": null,
  "updatedAt": "2026-10-04T05:06:36.271Z"
}`}</Response>
            </Endpoint>
            <Endpoint id="get-transactions" method="GET" path="/v1/wallet/transactions?limit=50&before=" summary="Every top-up, charge and refund, newest first. Paginate with the returned nextCursor in ?before=." />
          </Section>

          <Section id="sms" title="Sending SMS">
            <Endpoint id="send" method="POST" path="/v1/sms/send" summary="Send one message to up to 10,000 numbers. Returns immediately; delivery continues in the background.">
              <Params
                rows={[
                  ['senderId', 'string', 'An approved Sender ID (max 11 characters).'],
                  ['message', 'string', 'Up to 1,600 characters. May contain {fields} — see Personalised messages.'],
                  ['recipients', 'array', 'Phone numbers, or { "phone", "fields" } objects for per-person values.'],
                  ['scheduleAt', 'ISO date-time', 'Optional. Schedule instead of sending now.'],
                ]}
              />
              <LangTabs lang={lang} onChange={setLang} />
              <Code>{sendSample(lang)}</Code>
              <Response status="201 Created">{`{
  "batch": {
    "id": "order-1042-ready",
    "status": "submitting",
    "senderId": "ACME",
    "message": "Hi {first_name}, order {order_id} is ready.",
    "personalized": true,
    "totalRecipients": 1,
    "totalUnitsReserved": 1,
    "totalUnitsCharged": 0,
    "submittedCount": 0, "failedCount": 0, "unknownCount": 0, "deliveredCount": 0,
    "createdAt": "2026-10-04T05:06:36.266Z",
    "completedAt": null
  },
  "records": [
    { "id": "order-1042-ready__r0", "recipient": "233241234567",
      "message": "Hi Ama, order 1042 is ready.", "unitsPerMessage": 1, "status": "queued" }
  ]
}`}</Response>
              <p>
                Units are <strong>reserved</strong> when the request is accepted, <strong>charged</strong> for each message the network accepts,
                and <strong>returned</strong> for messages that fail. Poll <code className="font-mono">GET /v1/sms/batches/:id</code> for the outcome;
                a retry with the same Idempotency-Key returns <code className="font-mono">200</code> with the same batch.
              </p>
            </Endpoint>

            <Endpoint id="personalise" title="Personalised messages" summary="Write the message once; each recipient gets their own values.">
              <p>
                Put field names in braces: <code className="font-mono">{'{first_name}'}</code>. Add a fallback with a bar for recipients without a value:{' '}
                <code className="font-mono">{'{first_name|Customer}'}</code>. Values come from the <code className="font-mono">fields</code> you send, or —
                for numbers saved in your contacts — from the contact (<code className="font-mono">first_name</code>, <code className="font-mono">last_name</code>,{' '}
                <code className="font-mono">name</code>, <code className="font-mono">phone</code>, <code className="font-mono">email</code>,{' '}
                <code className="font-mono">dob</code> and any custom field from your imports).
              </p>
              <Code>{`{
  "senderId": "ACME",
  "message": "Hi {first_name}, your balance is GH₵ {balance}. Pay before {due|Friday}.",
  "recipients": [
    { "phone": "0241234567", "fields": { "first_name": "Ama",  "balance": "120.00", "due": "12 Oct" } },
    { "phone": "0201234567", "fields": { "first_name": "Kofi", "balance": "45.50" } }
  ]
}`}</Code>
              <p className="text-slate-500 dark:text-slate-400">
                If a field has no value and no fallback, the request is refused with <code className="font-mono">400</code> naming the field and how many
                recipients are affected — nothing is sent with a blank. Each message is billed by its own length.
              </p>
            </Endpoint>

            <Endpoint id="schedule" title="Scheduling" summary="Add scheduleAt (ISO 8601, UTC or with an offset) to send later.">
              <Code>{`{ "senderId": "ACME", "message": "Friday sale starts now!", "recipients": ["0241234567"],
  "scheduleAt": "2026-10-10T08:00:00Z" }`}</Code>
              <Response status="201 Created">{`{
  "scheduled": true,
  "campaign": {
    "id": "auto000009",
    "status": "scheduled",
    "nextRunAt": "2026-10-10T08:00:00.000Z",
    "estimate": { "recipients": 1, "units": 1 }
  }
}`}</Response>
              <p>Units are taken when it sends. Cancel with <code className="font-mono">POST /v1/campaigns/:id/cancel</code>.</p>
            </Endpoint>

            <Endpoint id="estimate" method="POST" path="/v1/sms/estimate" summary="Same body as send (without senderId). Returns the exact units and whether your balance covers them. Sends nothing.">
              <Response>{`{
  "recipients": 2,
  "units": 2,
  "availableUnits": 999,
  "sufficient": true,
  "personalized": true,
  "samples": [ { "phone": "233241234567", "message": "Hello there!", "segments": 1 } ]
}`}</Response>
            </Endpoint>

            <Endpoint id="batches" method="GET" path="/v1/sms/batches?limit=20&before=" summary="Your sends, newest first. Paginate with nextCursor." />
            <Endpoint id="batch" method="GET" path="/v1/sms/batches/:id" summary="One send with every recipient's status. Poll this after sending.">
              <Response>{`{
  "batch": { "id": "order-1042-ready", "status": "completed",
             "totalUnitsCharged": 1, "submittedCount": 1, "failedCount": 0, … },
  "records": [ { "recipient": "233241234567", "status": "submitted", "unitsCharged": 1, … } ]
}`}</Response>
            </Endpoint>

            <Endpoint id="statuses" title="Message statuses">
              <Table
                head={['Status', 'Meaning']}
                rows={[
                  ['queued / submitting', 'Accepted; being handed to the network.'],
                  ['submitted', 'The network accepted it (charged). Delivery to the phone not yet confirmed.'],
                  ['delivered', 'Delivery confirmed by the network.'],
                  ['failed', "Not sent. The unit was returned to your wallet."],
                  ['unknown', 'Outcome not yet known (e.g. network timeout). The unit stays reserved until it resolves — never charged twice.'],
                ]}
              />
              <p>Batch status: <code className="font-mono">submitting</code> → <code className="font-mono">completed</code>, <code className="font-mono">partial</code> or <code className="font-mono">failed</code>.</p>
            </Endpoint>
          </Section>

          <Section id="payments" title="Payments (top up your wallet)">
            <Endpoint id="create-payment" method="POST" path="/v1/payments" summary="Start a top-up and send the payer to checkoutUrl (mobile money or card). Units are added automatically when payment completes.">
              <Params
                rows={[
                  ['packageId', 'string', 'A package from GET /v1/pricing — or use units.'],
                  ['units', 'integer', 'Custom amount, priced at the current unit price.'],
                  ['email', 'string', 'Receipt email. Defaults to your account contact email.'],
                  ['callbackUrl', 'https URL', 'Where the payer returns after checkout (optional).'],
                  ['method', '"mobile_money" | "card"', 'Optional: preselect a method.'],
                ]}
              />
              <LangTabs lang={lang} onChange={setLang} />
              <Code>{paySample(lang)}</Code>
              <Response status="201 Created">{`{
  "payment": {
    "reference": "pja_a2eb5c72c7c8cae131fa4abd",
    "packageId": "starter",
    "units": 500,
    "amountGhs": 20,
    "currency": "GHS",
    "status": "pending",
    "paidAt": null,
    "walletCreditedAt": null
  },
  "checkoutUrl": "https://checkout…/pja_a2eb5c72c7c8cae131fa4abd"
}`}</Response>
            </Endpoint>
            <Endpoint id="get-payment" method="GET" path="/v1/payments/:reference" summary="Payment status. A pending payment is re-checked with the payment provider, and the wallet is credited if it was paid (safe to call repeatedly)." />
            <Endpoint id="list-payments" method="GET" path="/v1/payments?limit=20" summary="Your payments, newest first, with totals." />
          </Section>

          <Section id="campaigns" title="Scheduled sends">
            <Endpoint id="list-campaigns" method="GET" path="/v1/campaigns" summary="Scheduled, recurring and birthday campaigns (also those created in the dashboard). GET /v1/campaigns/:id for one." />
            <Endpoint id="cancel-campaign" method="POST" path="/v1/campaigns/:id/cancel" summary="Stop a scheduled campaign before it sends." />
          </Section>

          <Section id="sender-ids" title="Sender IDs">
            <Endpoint method="GET" path="/v1/sender-ids" summary="Your Sender IDs and their status. Request new ones in the dashboard (Messaging → Sender IDs).">
              <Response>{`{ "senderIds": [ { "senderId": "ACME", "status": "approved", "purpose": "Business Notifications", … } ], "count": 1 }`}</Response>
            </Endpoint>
          </Section>

          <Section id="public" title="Public endpoints (no key)">
            <Endpoint method="GET" path="/v1/pricing" summary="Current unit price and packages — for showing prices on your own site." />
            <Endpoint method="GET" path="/v1/platform" summary="Platform name and support contacts." />
          </Section>

          <Section id="billing" title="Pages & billing">
            <p>
              One unit = one SMS page to one recipient. Standard text fits <strong>160 characters</strong> in one page (153 per page when longer).
              Emoji and some symbols (e.g. ₵, “smart quotes”) switch the message to Unicode: <strong>70 characters</strong> (67 per page when longer).
              <code className="font-mono"> POST /v1/sms/estimate</code> tells you the exact cost before sending.
            </p>
          </Section>

          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} ProfJero Connect</span>
            <Link to="/signup" className="hover:text-[#1764e0]">Create an account</Link>
            <Link to="/login" className="hover:text-[#1764e0]">Sign in</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

function sendSample(lang: Lang): string {
  const body = `{
    "senderId": "ACME",
    "message": "Hi {first_name}, order {order_id} is ready.",
    "recipients": [{ "phone": "0241234567", "fields": { "first_name": "Ama", "order_id": "1042" } }]
  }`;
  switch (lang) {
    case 'curl':
      return `curl -X POST ${BASE}/v1/sms/send \\
  -H "Authorization: Bearer $PROFJERO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-1042-ready" \\
  -d '${body.replace(/\n {4}/g, ' ').replace(/\n {2}/g, ' ')}'`;
    case 'node':
      return `// Node 18+ — run on your server only.
const res = await fetch('${BASE}/v1/sms/send', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PROFJERO_API_KEY}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'order-1042-ready', // same key on retry = no double send
  },
  body: JSON.stringify(${body.replace(/\n {2}/g, '\n  ')}),
});
const data = await res.json();
if (!res.ok) throw new Error(\`\${res.status}: \${data.error.message}\`);
console.log(data.batch.id, data.batch.status);`;
    case 'python':
      return `import os, requests

res = requests.post(
    "${BASE}/v1/sms/send",
    headers={
        "Authorization": f"Bearer {os.environ['PROFJERO_API_KEY']}",
        "Idempotency-Key": "order-1042-ready",
    },
    json={
        "senderId": "ACME",
        "message": "Hi {first_name}, order {order_id} is ready.",
        "recipients": [{"phone": "0241234567", "fields": {"first_name": "Ama", "order_id": "1042"}}],
    },
    timeout=30,
)
res.raise_for_status()
print(res.json()["batch"]["id"])`;
    case 'php':
      return `<?php
$ch = curl_init("${BASE}/v1/sms/send");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("PROFJERO_API_KEY"),
    "Content-Type: application/json",
    "Idempotency-Key: order-1042-ready",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "senderId" => "ACME",
    "message" => "Hi {first_name}, order {order_id} is ready.",
    "recipients" => [["phone" => "0241234567", "fields" => ["first_name" => "Ama", "order_id" => "1042"]]],
  ]),
]);
$data = json_decode(curl_exec($ch), true);
echo $data["batch"]["id"];`;
  }
}

function paySample(lang: Lang): string {
  switch (lang) {
    case 'curl':
      return `curl -X POST ${BASE}/v1/payments \\
  -H "Authorization: Bearer $PROFJERO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: topup-2026-10-04" \\
  -d '{"packageId":"starter","email":"billing@acme.example","callbackUrl":"https://acme.example/billing/done"}'`;
    case 'node':
      return `const res = await fetch('${BASE}/v1/payments', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.PROFJERO_API_KEY}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'topup-2026-10-04',
  },
  body: JSON.stringify({ units: 2000, email: 'billing@acme.example', callbackUrl: 'https://acme.example/billing/done' }),
});
const { checkoutUrl, payment } = await res.json();
// Redirect the payer to checkoutUrl, then check GET /v1/payments/\${payment.reference}`;
    case 'python':
      return `res = requests.post(
    "${BASE}/v1/payments",
    headers={"Authorization": f"Bearer {os.environ['PROFJERO_API_KEY']}", "Idempotency-Key": "topup-2026-10-04"},
    json={"packageId": "starter", "email": "billing@acme.example"},
    timeout=30,
)
checkout_url = res.json()["checkoutUrl"]  # send the payer here`;
    case 'php':
      return `<?php
$ch = curl_init("${BASE}/v1/payments");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Authorization: Bearer " . getenv("PROFJERO_API_KEY"), "Content-Type: application/json", "Idempotency-Key: topup-2026-10-04"],
  CURLOPT_POSTFIELDS => json_encode(["packageId" => "starter", "email" => "billing@acme.example"]),
]);
$data = json_decode(curl_exec($ch), true);
header("Location: " . $data["checkoutUrl"]);`;
  }
}

// ── building blocks ─────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
    </section>
  );
}

function Endpoint({ id, method, path, title, summary, children }: { id?: string; method?: 'GET' | 'POST'; path?: string; title?: string; summary?: string; children?: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20 space-y-3 pt-2">
      {method && path ? (
        <h3 className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className={cn('px-2 py-0.5 rounded text-[11px] font-bold', method === 'GET' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300')}>{method}</span>
          <span className="text-slate-900 dark:text-white break-all">{path}</span>
        </h3>
      ) : (
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      )}
      {summary && <p>{summary}</p>}
      {children}
    </div>
  );
}

function Params({ rows }: { rows: Array<[string, string, string]> }) {
  return <Table head={['Field', 'Type', 'Description']} rows={rows.map(([a, b, c]) => [<code key="a" className="font-mono text-slate-900 dark:text-white">{a}</code>, <span key="b" className="font-mono text-[11px]">{b}</span>, c])} />;
}

function Table({ head, rows }: { head: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label={head.join(', ')}>
      <table className="w-full text-xs">
        <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
          <tr>{head.map((h) => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LangTabs({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="tablist" aria-label="Code language" className="flex gap-1">
      {LANGS.map(([id, label]) => (
        <button key={id} role="tab" type="button" aria-selected={lang === id} onClick={() => onChange(id)}
          className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold', lang === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800')}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre tabIndex={0} className="bg-slate-900 text-slate-100 text-[12px] leading-relaxed rounded-lg p-4 overflow-x-auto font-mono">{children}</pre>
      <button
        type="button"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked: the text is selectable */
          }
        }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Response({ status = '200 OK', children }: { status?: string; children: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Response · {status}</div>
      <Code>{children}</Code>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}
