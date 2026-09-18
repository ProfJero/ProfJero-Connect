import {
  X,
  Users,
  CreditCard,
  Package,
  Flag,
  Link2,
  Smartphone,
  Hash,
  Calendar,
  ShieldCheck,
  Clock,
  Info,
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { paymentDetail as d } from '../../mock/payments';
import { cn } from '../../lib/utils';

function AttrRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <div className="text-right min-w-0">{children}</div>
    </div>
  );
}

function VerificationCard({
  title,
  statusLabel,
  description,
  icon: Icon,
}: {
  title: string;
  statusLabel: string;
  description: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Icon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
          <span>{title}</span>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
          ● {statusLabel}
        </span>
      </div>
      <p className="text-[11px] text-slate-500">{description}</p>
    </div>
  );
}

export function PaymentDetailsInspector() {
  return (
    <aside
      className="w-full xl:w-[370px] bg-white border border-slate-200/90 rounded-xl flex flex-col shrink-0"
      data-purpose="payment-details-inspector"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm">Payment Details</h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1976d2] flex items-center justify-center">
              <CreditCard className="w-5 h-5" strokeWidth={2} />
            </div>
            <p className="font-bold text-slate-800 text-xs leading-tight">{d.reference}</p>
          </div>
          <StatusBadge status={d.status} />
        </div>

        <div className="space-y-3 text-xs">
          <AttrRow icon={Users} label="Customer / Project">
            <p className="font-bold text-slate-800 leading-tight">{d.project}</p>
            <p className="text-[11px] text-slate-400">{d.projectClient}</p>
          </AttrRow>

          <AttrRow icon={CreditCard} label="Amount">
            <p className="font-bold text-slate-900 text-sm">{d.amount}</p>
          </AttrRow>

          <AttrRow icon={Package} label="Units Purchased">
            <p className="font-semibold text-slate-800">{d.unitsPurchased}</p>
          </AttrRow>

          <AttrRow icon={Flag} label="Gateway">
            <p className="font-semibold text-slate-800">{d.gateway}</p>
          </AttrRow>

          <AttrRow icon={Link2} label="Gateway Reference">
            <p className="font-mono text-slate-700 text-[11px]">{d.gatewayReference}</p>
          </AttrRow>

          <AttrRow icon={Smartphone} label="Payment Method">
            <p className="font-semibold text-slate-800">{d.method}</p>
          </AttrRow>

          <AttrRow icon={Hash} label="Transaction Reference">
            <p className="font-semibold text-slate-800 font-mono text-[11px]">
              {d.txnReference}
            </p>
          </AttrRow>

          <AttrRow icon={Calendar} label="Date & Time">
            <p className="font-semibold text-slate-800 text-[11px]">{d.dateTime}</p>
          </AttrRow>
        </div>

        <div className="space-y-2.5 pt-1">
          <VerificationCard
            title="Payment Verification"
            statusLabel={d.verification.label}
            description={d.verification.description}
            icon={ShieldCheck}
          />
          <VerificationCard
            title="Unit Crediting Status"
            statusLabel={d.crediting.label}
            description={d.crediting.description}
            icon={ShieldCheck}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
            <h4>Transaction History</h4>
          </div>

          <div className="relative pl-5 space-y-4 border-l-2 border-slate-200 ml-2 py-1">
            {d.timeline.map((event, i) => {
              const isPurple = event.color === 'purple';
              return (
                <div key={i} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ring-2 ring-white',
                      isPurple ? 'bg-purple-600' : 'bg-emerald-500',
                    )}
                  >
                    {event.icon === 'check' ? (
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 12h6" />
                      </svg>
                    )}
                  </span>
                  <p className="font-bold text-slate-800 text-[11px] leading-tight">
                    {event.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{event.time}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start">
          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            <Info className="w-2.5 h-2.5" strokeWidth={2.5} />
          </div>
          <p className="text-[11px] text-blue-900 leading-snug">
            <span className="font-bold">Note:</span> Payment verification and unit crediting are
            processed separately. A successful payment does not automatically mean units have been
            credited.
          </p>
        </div>
      </div>
    </aside>
  );
}