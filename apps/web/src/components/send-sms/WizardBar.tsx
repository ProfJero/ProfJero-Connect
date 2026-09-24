import { cn } from '../../lib/utils';

export type WizardStep = 1 | 2 | 3;

interface WizardBarProps {
  currentStep: WizardStep;
}

const STEPS: Array<{ number: WizardStep; label: string }> = [
  { number: 1, label: 'Project' },
  { number: 2, label: 'Compose' },
  { number: 3, label: 'Review & Send' },
];

export function WizardBar({ currentStep }: WizardBarProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl py-3 px-4 sm:px-8 shadow-xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between relative">
        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-px bg-slate-200 z-0" />

        {STEPS.map((step) => {
          const isActive = step.number === currentStep;
          const isPast = step.number < currentStep;

          return (
            <div
              key={step.number}
              className="relative z-10 flex items-center gap-2.5 bg-white px-2 sm:px-4"
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full font-semibold text-xs flex items-center justify-center shrink-0',
                  isActive || isPast
                    ? 'bg-[#1976d2] text-white shadow'
                    : 'border border-slate-300 text-slate-400 bg-white',
                )}
              >
                {step.number}
              </span>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  isActive
                    ? 'font-semibold text-slate-900'
                    : isPast
                      ? 'font-medium text-slate-700'
                      : 'font-medium text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}