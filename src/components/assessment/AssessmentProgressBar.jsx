export function AssessmentProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="w-full flex gap-1.5 items-center">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isCompleted = idx < currentStep
        const isCurrent = idx === currentStep

        return (
          <div
            key={idx}
            className="h-1.5 flex-1 rounded-full overflow-hidden bg-elevated border border-strong transition-all duration-300"
          >
            <div
              className={`h-full w-full transition-all duration-500 rounded-full ${
                isCompleted
                  ? 'bg-accent'
                  : isCurrent
                  ? 'bg-accent/50 animate-pulse'
                  : 'bg-transparent'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}
