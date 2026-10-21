export function formatDatePt(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (!date || isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatPostDate = formatDatePt

export function formatDatePtShort(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (!date || isNaN(date.getTime())) return ''
  const options = { day: 'numeric', month: 'short' }
  if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric'
  return date.toLocaleDateString('pt-PT', options).replace(/\.$/, '')
}

export const formatPostDateShort = formatDatePtShort

export function formatPostRelative(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (!date || isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60 * 1000) return 'agora há pouco'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(days / 365)
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`
}
