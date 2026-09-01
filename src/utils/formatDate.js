export function formatDatePt(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (!date || isNaN(date.getTime())) return ''
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}
