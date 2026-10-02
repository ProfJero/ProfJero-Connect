import { Link } from 'react-router-dom';
import { MessageCircle, Send, Check, Signal, Wifi, Battery, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { featuredService } from '../../lib/servicesContent';

export function FeaturedServiceBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#e7f1ff] via-[#ebf4ff] to-[#e4f0fe] dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-[#1a6cf0] dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-500/20">
            {featuredService.badge}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                <MessageCircle className="w-6 h-6" strokeWidth={2} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {featuredService.name}
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              {featuredService.description}
            </p>
          </div>
          <div>
            <Link
              to={featuredService.ctaPath}
              className="inline-flex items-center gap-2 bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-medium text-sm px-6 py-2.5 rounded-lg shadow-md shadow-blue-500/25 transition"
            >
              <Send className="w-4 h-4 -rotate-45" strokeWidth={2} />
              {featuredService.ctaLabel}
            </Link>
          </div>
        </div>

        {/* Center column: phone mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <PhoneMockup />
        </div>

        {/* Right column: benefits */}
        <div className="lg:col-span-3 space-y-3.5 lg:pl-6 lg:border-l lg:border-blue-200/60 dark:lg:border-slate-800">
          {featuredService.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  const { phonePreview } = featuredService;
  return (
    <div
      className="w-64 bg-slate-900 p-2.5 rounded-[36px] shadow-2xl border-4 border-slate-800"
      style={{
        transform: 'perspective(1000px) rotateY(-8deg) rotateX(4deg) rotate(-2deg)',
        boxShadow:
          '0 25px 50px -12px rgba(14, 165, 233, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="bg-white dark:bg-slate-950 rounded-[28px] overflow-hidden pt-2 pb-5 px-3 border border-slate-100 dark:border-slate-800 min-h-[300px] flex flex-col justify-between">
        <div>
          {/* Status bar */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-2 py-0.5">
            <span>{phonePreview.time}</span>
            <div className="flex items-center gap-1">
              <Signal className="w-2.5 h-2.5" strokeWidth={2} />
              <Wifi className="w-2.5 h-2.5" strokeWidth={2} />
              <Battery className="w-3 h-3" strokeWidth={2} />
            </div>
          </div>

          {/* In-app header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 pt-1 text-slate-800 dark:text-slate-200">
            <ChevronLeft className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
            <span className="text-xs font-bold">{phonePreview.header}</span>
            <MoreHorizontal className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </div>

          {/* Message bubble */}
          <div className="mt-4 bg-blue-50/80 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20 text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
            {phonePreview.message}
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-400 pr-1">
          {phonePreview.counter}
        </div>
      </div>
    </div>
  );
}