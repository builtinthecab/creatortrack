// Pure utility / formatting functions — no localStorage
// All database operations are in src/lib/db.js

export function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n?.toLocaleString() ?? '0'
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export function getGrowthPercent(history, platform, metric) {
  const dates = Object.keys(history).sort()
  if (dates.length < 2) return 0
  const recent = history[dates[dates.length - 1]]?.[platform]?.[metric] ?? 0
  const older  = history[dates[Math.max(0, dates.length - 8)]]?.[platform]?.[metric] ?? 0
  if (!older) return 0
  return (((recent - older) / older) * 100).toFixed(1)
}
