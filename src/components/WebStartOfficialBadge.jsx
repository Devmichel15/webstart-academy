import { BadgeCheck } from 'lucide-react'
import { isOfficialTrail } from '../data/trails.js'

// Selo reutilizável «Produção WebStart».
//
// Centraliza a deteção da origem do conteúdo: qualquer trilha com
// `origin: 'webstart'` (metadado definido em createTrail) recebe o selo,
// sem verificações espalhadas pelo código. Fica assim pronto para
// identificar automaticamente futuras formações oficiais da WebStart.

function WebStartMark({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 124 127"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M25.0542 126.645L0 33.4458L11.4544 33.495L30.5829 109.396L31.492 109.4L51.6359 33.6677L64.363 33.7224L83.8552 109.625L84.7643 109.629L104.545 33.8951L115.999 33.9443L90.1445 126.925L78.5083 126.875L58.2818 52.6055L57.5546 52.6024L36.6905 126.695L25.0542 126.645Z"
        fill="currentColor"
        className="text-brand-700 dark:text-brand-300"
      />
      <path
        d="M34.1709 123.347L7.41801 30.6209L18.8714 30.4609L39.3835 106L40.2925 105.987L59.0493 29.8994L71.7753 29.7215L92.651 105.255L93.56 105.243L111.953 29.1601L123.407 29L99.2554 122.438L87.6202 122.6L66.0402 48.7126L65.313 48.7228L45.8061 123.185L34.1709 123.347Z"
        fill="#10B981"
      />
    </svg>
  )
}

export function WebStartOfficialBadge({ trail, variant = 'default', className = '' }) {
  if (!isOfficialTrail(trail)) return null

  const compact = variant === 'compact'

  return (
    <span
      className={`inline-flex items-center rounded-md border-2 border-brand-800 bg-white font-black uppercase tracking-wide text-brand-900 shadow-[2px_2px_0_0_#065f46] dark:border-brand-300 dark:bg-brand-950 dark:text-brand-100 dark:shadow-[2px_2px_0_0_#34d399] ${
        compact ? 'gap-1 px-1.5 py-0.5 text-[9px]' : 'gap-1.5 px-2.5 py-1 text-xs'
      } ${className}`}
      title={`Trilha oficial produzida pela WebStart${trail?.instructor ? ` · Lecionado por ${trail.instructor}` : ''}`}
    >
      <WebStartMark size={compact ? 11 : 14} />
      <span>Produção WebStart</span>
      {!compact && <BadgeCheck size={13} className="text-brand-600 dark:text-brand-300" aria-hidden="true" />}
    </span>
  )
}
