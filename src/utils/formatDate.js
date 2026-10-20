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
