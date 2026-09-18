import { MessageSquare, ShieldCheck, Layers, Wallet } from 'lucide-react';

const FEATURES = [
  {
    icon: Layers,
    title: 'Central SMS infrastructure',
    description: 'One gateway for every client project.',
  },
  {
    icon: Wallet,
    title: 'Per-project wallets',
    description: 'Append-only ledger, full audit trail.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    description: 'API keys hashed, secrets server-side only.',
  },
];

export function LoginBrandPanel() {
  return (
    <div className="relative overflow-hidden bg-[#0c1e38] text-white flex-1 flex flex-col">
      {/* Decorative gradient glows */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-[#1976d2]/30 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full bg-blue-500/15 blur-[120px]"
        aria-hidden="true"
      />

      {/* Subtle grid pattern */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.04]"
        aria-hidden="true"
      >
        <defs>
          <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>

      <div className="relative flex-1 flex flex-col justify-between p-10 lg:p-14">
        {/* Top: brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1976d2] to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-[17px] leading-tight tracking-tight">
              ProfJero SMS
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              One Platform. Multiple Projects.
            </p>
          </div>
        </div>

        {/* Middle: hero copy */}
        <div className="max-w-md my-12">
          <h2 className="text-3xl lg:text-[34px] font-bold leading-[1.15] tracking-tight">
            Central SMS infrastructure for all your projects.
          </h2>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Manage projects, wallets, payments and provider integrations from a single
            command centre — built for scale, designed for clarity.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-400" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{title}</div>
                  <div className="text-[12px] text-slate-400 mt-0.5 leading-relaxed">
                    {description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>ProfJero SMS v1.0.0</span>
          <span>© 2025 ProfJero Technologies</span>
        </div>
      </div>
    </div>
  );
}