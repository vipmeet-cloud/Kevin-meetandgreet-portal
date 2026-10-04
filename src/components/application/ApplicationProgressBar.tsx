interface ApplicationProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ApplicationProgressBar({
  currentStep,
  totalSteps = 5,
  onStepClick,
}: ApplicationProgressBarProps) {
  const steps = [
    { num: 1, label: '01 — About' },
    { num: 2, label: '02 — Experience' },
    { num: 3, label: '03 — Details' },
    { num: 4, label: '04 — Review' },
    { num: 5, label: '05 — Submit' },
  ];

  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100));

  return (
    <div className="w-full bg-[#080A0F]/90 backdrop-blur-xl border-b border-white/[0.06] sticky top-16 z-30 py-3 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-2">
        
        {/* Step Indicator Header (Part G) */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white font-mono font-semibold tracking-wider text-[11px] uppercase">
              VIP APPLICATION
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono text-xs">
              Step 0{currentStep} of 0{totalSteps}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {Math.round(progressPercent)}%
          </div>
        </div>

        {/* Modern Minimal Progress Line */}
        <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Tabs for Tablet/Desktop */}
        <div className="hidden sm:flex items-center justify-between pt-1">
          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            const isClickable = onStepClick && s.num < currentStep;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => isClickable && onStepClick(s.num)}
                disabled={!isClickable}
                className={`text-[11px] transition-colors ${
                  isCurrent
                    ? 'text-white font-bold'
                    : isCompleted
                    ? 'text-slate-300 hover:text-white cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
