import { MessageSquare, Database, Phone, Code2, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../brand/BrandMark';

const FEATURES = [
  { icon: MessageSquare, title: 'Bulk SMS', description: 'Reach your audience instantly' },
  { icon: Database, title: 'Mobile Data', description: 'Fast and reliable data bundles' },
  { icon: Phone, title: 'Airtime', description: 'Top up and keep your world connected' },
  { icon: Code2, title: 'API & Integrations', description: 'Build and automate your communications' },
  { icon: ShieldCheck, title: 'Secure & Reliable', description: 'Your data and transactions are protected' },
];

export function LoginHero() {
  return (
    <div className="relative h-full bg-[#04162e] text-white p-8 sm:p-12 xl:p-14 flex flex-col justify-between overflow-hidden">
      {/* Decorative gradient glows — swap for your own image if desired */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-[#1a6cf0]/30 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full bg-cyan-500/15 blur-[130px]"
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

      {/* Top: logo */}
      <div className="relative flex items-center gap-3.5">
        <BrandMark className="w-12 h-12" />
        <div>
          <div className="text-2xl font-extrabold tracking-tight leading-none">
            ProfJero
          </div>
          <div className="text-cyan-400 font-semibold tracking-wider text-sm mt-0.5">
            Connect
          </div>
          <p className="text-[11px] text-slate-300 font-medium tracking-wide mt-1">
            Connect. Communicate. Grow.
          </p>
        </div>
      </div>

      {/* Middle: hero */}
      <div className="relative my-10 space-y-8 max-w-xl">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-black leading-[1.1] tracking-tight">
            Your All-in-One <br />
            <span className="text-cyan-400">Communication &amp; Connectivity</span> Platform
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
            Send messages, buy data, purchase airtime and access powerful communication
            tools — all from one secure platform.
          </p>
        </div>

        <div className="space-y-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shrink-0 backdrop-blur-sm">
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white tracking-wide">{title}</h4>
                <p className="text-xs text-slate-300">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: social proof + handwriting */}
      <div className="relative pt-8 flex flex-col sm:flex-row items-end justify-between gap-6 border-t border-blue-900/30">
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
          Trusted by businesses, schools, churches, organisations and communities across
          Ghana and beyond.
        </p>
        <div className="text-right sm:pr-4 flex flex-col items-end">
          <span className="handwritten-text swoosh-underline text-xl sm:text-2xl font-bold text-white tracking-wide leading-tight inline-block">
            Smarter
            <br />
            Communication
            <br />
            for a Brighter
            <br />
            Future
          </span>
        </div>
      </div>
    </div>
  );
}