import { motion } from 'framer-motion'

export function HowItWorksSection({ content }) {
  if (!content) return null

  const steps = content.split('\n').filter(Boolean).map((s) => s.trim().replace(/^-\s*/, '').replace(/^[↓•]\s*/, ''))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-2"
    >
      {steps.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-lg border-3 border-brand-800 bg-brand-50 px-4 py-2 font-bold dark:border-brand-400 dark:bg-brand-900">
                {step}
              </span>
              {i < steps.length - 1 && (
                <span className="text-2xl font-black text-brand-500">↓</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="leading-relaxed text-brand-800 dark:text-brand-200">{content}</p>
      )}
    </motion.div>
  )
}
