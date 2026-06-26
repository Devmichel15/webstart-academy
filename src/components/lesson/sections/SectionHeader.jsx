import { motion } from 'framer-motion'
import { BookOpen, CheckSquare, Code2, HelpCircle, Lightbulb, PlayCircle, Sparkles, Target, Trophy, AlertTriangle, FlaskConical, Eye, History, GraduationCap } from 'lucide-react'

const sectionIcons = {
  introduction: BookOpen,
  objectives: Target,
  prerequisites: CheckSquare,
  history: History,
  concept: GraduationCap,
  howItWorks: Eye,
  realWorldApplications: Trophy,
  bestPractices: Sparkles,
  commonMistakes: AlertTriangle,
  deepDive: FlaskConical,
  curiosities: Lightbulb,
  example: Code2,
  playground: PlayCircle,
  challenge: HelpCircle,
  exercise: Code2,
  lab: FlaskConical,
  quiz: HelpCircle,
}

const sectionGradients = {
  introduction: 'from-blue-500 to-blue-700',
  objectives: 'from-purple-500 to-purple-700',
  prerequisites: 'from-gray-500 to-gray-700',
  history: 'from-amber-500 to-amber-700',
  concept: 'from-brand-500 to-brand-700',
  howItWorks: 'from-cyan-500 to-cyan-700',
  realWorldApplications: 'from-emerald-500 to-emerald-700',
  bestPractices: 'from-green-500 to-green-700',
  commonMistakes: 'from-red-500 to-red-700',
  deepDive: 'from-indigo-500 to-indigo-700',
  curiosities: 'from-yellow-500 to-yellow-700',
  example: 'from-brand-500 to-brand-700',
  playground: 'from-orange-500 to-orange-700',
  challenge: 'from-pink-500 to-pink-700',
  exercise: 'from-violet-500 to-violet-700',
  lab: 'from-teal-500 to-teal-700',
  quiz: 'from-rose-500 to-rose-700',
}

export function SectionHeader({ type, title }) {
  const Icon = sectionIcons[type] || BookOpen
  const gradient = sectionGradients[type] || 'from-brand-500 to-brand-700'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-4 flex items-center gap-3"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-[3px_3px_0_0_#064e3b] dark:shadow-[3px_3px_0_0_#34d399]`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-black">{title}</h2>
    </motion.div>
  )
}
