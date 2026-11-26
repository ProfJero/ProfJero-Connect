import { Check, CreditCard, Smartphone, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

// Checkout channels. RULE: no gateway names in customer copy.
export interface PaymentMethod {
  id: 'mobile_money' | 'card';
  name: string;
  description: string;
  icon: LucideIcon;
  telcos?: Array<{ label: string; tone: 'mtn' | 'telecel' | 'airteltigo' }>;
  cardBrands?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    description: 'MTN, Telecel, AirtelTigo',
    icon: Smartphone,
    telcos: [
      { label: 'MTN', tone: 'mtn' },
      { label: 'Telecel', tone: 'telecel' },
      { label: 'AirtelTigo', tone: 'airteltigo' },
    ],
  },
  {
    id: 'card',
    name: 'Card',
    description: 'Visa, Mastercard',
    icon: CreditCard,
    cardBrands: true,
  },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  step = 2,
}: {
  selected: PaymentMethod['id'];
  onSelect: (id: PaymentMethod['id']) => void;
  step?: number;
}) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3.5">
        <span className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {step}
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            Payment Method
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Choose how you want to make the payment.
          </p>
        </div>
      </div>

      {/* Method cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isActive = selected === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={cn(
                'relative rounded-xl p-4 flex flex-col justify-between cursor-pointer text-left transition border',
                isActive
                  ? 'border-2 border-[#1a6cf0] bg-blue-50/20 dark:bg-blue-500/10'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs',
              )}
            >
              {/* Radio/check indicator */}
              <div className="absolute top-3 right-3">
                {isActive ? (
                  <div className="w-4 h-4 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#1764e0] dark:text-blue-400 shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {method.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-500 font-medium truncate">
                      {method.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand badges */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 min-h-[28px]">
                {method.telcos && (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {method.telcos.map((telco) => (
                      <TelcoBadge key={telco.tone} tone={telco.tone} />
                    ))}
                  </div>
                )}
                {method.cardBrands && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black italic tracking-tighter text-blue-800 dark:text-blue-400">
                      VISA
                    </span>
                    <div className="flex items-center -space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-red-500 opacity-90 inline-block" />
                      <span className="w-4 h-4 rounded-full bg-amber-400 opacity-90 inline-block" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TelcoBadge({ tone }: { tone: 'mtn' | 'telecel' | 'airteltigo' }) {
  if (tone === 'mtn') {
    return (
      <span className="inline-block px-1.5 py-0.5 bg-[#FFCC00] text-slate-900 font-black text-[9px] rounded tracking-tight">
        MTN
      </span>
    );
  }
  if (tone === 'telecel') {
    return (
      <span className="inline-flex items-center gap-0.5">
        <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center">
          t
        </span>
        <span className="text-[9px] font-bold text-red-700">telecel</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center">
      <span className="text-[10px] font-bold text-red-700">airtel</span>
      <span className="text-[10px] font-bold text-blue-700">tigo</span>
    </span>
  );
}