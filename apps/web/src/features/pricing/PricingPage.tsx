import { useState } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { UnitRateCard } from '../../components/pricing/UnitRateCard';
import { PackagesTable } from '../../components/pricing/PackagesTable';
import { EditSettingsModal } from '../../components/pricing/EditSettingsModal';
import { PackageFormModal } from '../../components/pricing/PackageFormModal';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type { Package, PricingResponse, Service } from '@profjero/shared';

const SERVICE_TABS: Array<{
  key: Service;
  label: string;
  available: boolean;
}> = [
  { key: 'sms', label: 'SMS', available: true },
  { key: 'airtime', label: 'Airtime', available: false },
  { key: 'data', label: 'Data Bundles', available: false },
];

export function PricingPage() {
  const [service, setService] = useState<Service>('sms');
  const [editSettingsOpen, setEditSettingsOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const api = useApi<PricingResponse>(
    service ? `/admin/pricing/${service}` : null,
  );

  const pricing = api.data?.pricing;
  const packages = pricing?.packages ?? [];

  const handleAddPackage = () => {
    setEditingPackage(null);
    setPackageModalOpen(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageModalOpen(true);
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <Tag className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pricing
          </h1>
          <p className="text-xs text-slate-500">
            Configure the unit rate and package catalog clients see.
          </p>
        </div>
      </div>

      {/* Service tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 max-w-md">
        {SERVICE_TABS.map((tab) => {
          const isActive = service === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => tab.available && setService(tab.key)}
              disabled={!tab.available}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : tab.available
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-500 cursor-not-allowed',
              )}
            >
              {tab.label}
              {!tab.available && (
                <span className="ml-1.5 text-[9px] uppercase tracking-wide opacity-70">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {api.error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load pricing.</div>
            <div className="mt-0.5 opacity-80">{api.error.message}</div>
          </div>
          <button
            onClick={() => api.reload()}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {pricing && (
        <>
          <UnitRateCard
            settings={pricing}
            onEdit={() => setEditSettingsOpen(true)}
          />

          <PackagesTable
            packages={packages}
            loading={api.loading && !api.data}
            service={service}
            onAdd={handleAddPackage}
            onEdit={handleEditPackage}
            onChanged={() => api.reload()}
          />
        </>
      )}

      {api.loading && !api.data && (
        <>
          <div className="h-40 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
          <div className="h-64 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
        </>
      )}

      {pricing && (
        <>
          <EditSettingsModal
            open={editSettingsOpen}
            service={service}
            settings={pricing}
            onClose={() => setEditSettingsOpen(false)}
            onSaved={() => {
              setEditSettingsOpen(false);
              api.reload();
            }}
          />
          <PackageFormModal
            open={packageModalOpen}
            service={service}
            existing={editingPackage}
            onClose={() => {
              setPackageModalOpen(false);
              setEditingPackage(null);
            }}
            onSaved={() => {
              setPackageModalOpen(false);
              setEditingPackage(null);
              api.reload();
            }}
          />
        </>
      )}
    </main>
  );
}