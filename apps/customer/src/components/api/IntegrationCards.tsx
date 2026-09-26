import { Link2, ArrowRight, Cloud } from 'lucide-react';
import { integrationCards, type IntegrationId } from '../../mock/api';

export function IntegrationCards() {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 rotate-45" strokeWidth={2.5} />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Integration Examples
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Popular platforms and technologies you can integrate with.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {integrationCards.map((card) => (
          <div
            key={card.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="w-10 h-10 mb-3 flex items-center justify-start">
                <IntegrationLogo id={card.id} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {card.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {card.description}
              </p>
            </div>
            <a
              className="inline-flex items-center text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-4 transition-colors"
              href={card.guideUrl}
            >
              View Guide
              <ArrowRight className="w-3.5 h-3.5 ml-1" strokeWidth={2} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationLogo({ id }: { id: IntegrationId }) {
  switch (id) {
    case 'firebase':
      return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M4.68 18.06L7.45 2.87c.07-.4.59-.53.84-.21l3.52 4.47L4.68 18.06z" fill="#FFA000" />
          <path d="M13.56 9.06l2.35-4.49c.21-.4.8-.35.94.08l3.18 10.42-6.47-6.01z" fill="#F57C00" />
          <path d="M4.68 18.06l-.27-.47a.78.78 0 01.3-.99L11.81 7.13l1.75 1.93-8.88 9z" fill="#FFCA28" />
          <path d="M12.43 21.6c-.28.16-.62.16-.9 0L3.1 16.94a.78.78 0 01-.15-1.22l1.73-1.66 7.35 4.3 7.04-4.3 1.25 1.2a.78.78 0 01-.08 1.25l-7.81 5.09z" fill="#FFA000" />
        </svg>
      );
    case 'nodejs':
      return (
        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
          <path d="M16 2.5l12 6.9v13.8L16 30.1 4 23.2V9.4L16 2.5z" stroke="#339933" strokeWidth="2.5" />
          <path d="M13.5 12.5v7m0-3.5h5v3.5" stroke="#339933" strokeLinecap="round" strokeWidth="2.2" />
        </svg>
      );
    case 'php':
      return (
        <div className="w-12 h-7 bg-[#777bb4] rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-[10px] italic tracking-tight font-serif">
            php
          </span>
        </div>
      );
    case 'python':
      return (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M11.9 2c-4.2 0-3.9 1.8-3.9 1.8l.04 1.9h4v.6H6.2S2 5.8 2 10.1c0 4.2 3.7 4 3.7 4h1.1v-1.6s-.1-1.9 1.9-1.9h4.3s1.8.03 1.8-1.8V4.3c0-2.3-3-2.3-3-2.3zm-1.2 1.2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z" fill="#3776AB" />
          <path d="M12.1 22c4.2 0 3.9-1.8 3.9-1.8l-.04-1.9h-4v-.6h5.8s4.2.5 4.2-3.8c0-4.2-3.7-4-3.7-4h-1.1v1.6s.1 1.9-1.9 1.9H11s-1.8-.03-1.8 1.8v4.5c0 2.3 3 2.3 3 2.3zm1.2-1.2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z" fill="#FFD43B" />
        </svg>
      );
    case 'rest':
      return <Cloud className="w-8 h-8 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />;
  }
}