export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${value}`
}

export function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    value
  )
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(iso)
  )
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffDays = Math.floor((now - then) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  const months = Math.floor(diffDays / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatDueDate(iso: string): { label: string; overdue: boolean; today: boolean } {
  const due = new Date(iso)
  const now = new Date()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return { label: 'Today', overdue: false, today: true }
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false, today: false }
  if (diffDays === -1) return { label: 'Yesterday', overdue: true, today: false }
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true, today: false }
  if (diffDays < 7) return { label: `In ${diffDays}d`, overdue: false, today: false }
  return { label: formatDate(iso), overdue: false, today: false }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
