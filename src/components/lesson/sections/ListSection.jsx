import { motion } from 'framer-motion'
import { CheckCircle2, CircleX, Lightbulb, Trophy, Sparkles } from 'lucide-react'

const listStyles = {
  bestPractices: { icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-500' },
  commonMistakes: { icon: CircleX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-500' },
  realWorldApplications: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-500' },
  curiosities: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-500' },
  objectives: { icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-500' },
  prerequisites: { icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950', border: 'border-gray-500' },
}

export function ListSection({ type, items }) {
  if (!items || !items.length) return null

  const style = listStyles[type] || { icon: CheckCircle2, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950', border: 'border-brand-500' }
  const Icon = style.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-xl border-3 ${style.border} ${style.bg} p-5`}
    >
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <Icon size={18} className={`mt-0.5 shrink-0 ${style.color}`} strokeWidth={2.5} />
            <span className="leading-relaxed text-brand-800 dark:text-brand-200">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
