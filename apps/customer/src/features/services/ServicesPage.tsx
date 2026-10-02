import { ShieldCheck } from 'lucide-react';
import { FeaturedServiceBanner } from '../../components/services/FeaturedServiceBanner';
import { ServiceCard } from '../../components/services/ServiceCard';
import { WhyChooseSection } from '../../components/services/WhyChooseSection';
import { serviceCards, trustBadges } from '../../lib/servicesContent';

export function ServicesPage() {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      {/* Breadcrumb + heading */}
      <div>
        <div className="text-xs font-medium text-[#1a6cf0] dark:text-blue-400 mb-1">
          Services
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Services
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Access communication and connectivity services from one platform.
            </p>
          </div>

          {/* Trust badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#1a6cf0] text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-500/20">
              <ShieldCheck className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 flex-wrap">
                {trustBadges.map((badge, i) => (
                  <span key={badge} className="flex items-center gap-1.5">
                    <span>{badge}</span>
                    {i < trustBadges.length - 1 && (
                      <span className="text-blue-300 dark:text-blue-600">•</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Trusted by businesses, organisations and communities across Ghana.
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeaturedServiceBanner />

      {/* Service grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {serviceCards.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>

      <WhyChooseSection />
    </main>
  );
}