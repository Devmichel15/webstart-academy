import { CheckCircle2 } from 'lucide-react'

export function PremiumFeatureCard({ label, description }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-2 border-brand-800/30 bg-white/5 p-4 dark:border-brand-400/20">
      <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-brand-500" />
      <div>
        <p className="text-sm font-black text-primary">{label}</p>
        <p className="text-xs text-secondary">{description}</p>
      </div>
    </div>
  )
}
