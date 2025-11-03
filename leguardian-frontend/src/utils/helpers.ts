/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const d = new Date(date)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) return `${interval}y ago`

  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) return `${interval}mo ago`

  interval = Math.floor(seconds / 86400)
  if (interval >= 1) return `${interval}d ago`

  interval = Math.floor(seconds / 3600)
  if (interval >= 1) return `${interval}h ago`

  interval = Math.floor(seconds / 60)
  if (interval >= 1) return `${interval}m ago`

  return `${Math.floor(seconds)}s ago`
}

/**
 * Get event color by type
 */
export const getEventColor = (
  type: string
): { bg: string; text: string; border: string } => {
  switch (type) {
    case 'arrived':
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
      }
    case 'lost':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
      }
    case 'danger':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
      }
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-200',
      }
  }
}

/**
 * Get event icon by type
 */
export const getEventIcon = (type: string): string => {
  switch (type) {
    case 'arrived':
      return '✅'
    case 'lost':
      return '⚠️'
    case 'danger':
      return '🚨'
    default:
      return '📍'
  }
}
