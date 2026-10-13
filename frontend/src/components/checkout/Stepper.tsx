export interface StepDef {
  key: string;
  label: string;
}

export function Stepper({ steps, currentKey }: { steps: StepDef[]; currentKey: string }) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <ol className="flex items-center w-full">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className={`flex items-center ${isLast ? "shrink-0" : "flex-1"}`}>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                  done
                    ? "bg-[#1A2B1C] text-white"
                    : active
                    ? "bg-[#1A2B1C] text-white"
                    : "bg-[#F0EDE8] text-[#8A8A8A]"
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                  active ? "text-[#1A1A1A]" : done ? "text-[#4A4A4A]" : "text-[#ABABAB]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && <span className="flex-1 h-px bg-[#E8E2D8] mx-2 sm:mx-4" />}
          </li>
        );
      })}
    </ol>
  );
}
