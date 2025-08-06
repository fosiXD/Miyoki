function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const remainingSeconds = seconds % 60
  const remainingMinutes = minutes % 60
  const remainingHours = hours % 24

  const parts = []
  if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`)
  if (remainingHours > 0)
    parts.push(`${remainingHours} hora${remainingHours !== 1 ? 's' : ''}`)
  if (remainingMinutes > 0)
    parts.push(`${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`)
  if (remainingSeconds > 0 || parts.length === 0)
    parts.push(
      `${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`
    ) // Always show seconds if nothing else, or if 0

  return parts.join(', ')
}

module.exports = formatDuration
