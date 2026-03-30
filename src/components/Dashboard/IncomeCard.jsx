import { ShoppingBag, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/storage'

export default function IncomeCard({ history }) {
  const dates  = Object.keys(history).sort()
  const latest  = history[dates[dates.length - 1]]  || {}
  const oldest30 = history[dates[Math.max(0, dates.length - 30)]] || {}

  // Estimate monthly Gumroad income from revenue growth over last 30 days
  const revenueGrowth = (latest?.gumroad?.revenue || 0) - (oldest30?.gumroad?.revenue || 0)
  const gumroadMonthly = Math.max(revenueGrowth, (latest?.gumroad?.revenue || 0) * 0.15)

  const total = Math.round(gumroadMonthly) || 0

  // Estimate growth vs previous period
  const prev30 = history[dates[Math.max(0, dates.length - 60)]] || {}
  const prevRevGrowth = (oldest30?.gumroad?.revenue || 0) - (prev30?.gumroad?.revenue || 0)
  const growthPct = prevRevGrowth > 0
    ? (((gumroadMonthly - prevRevGrowth) / prevRevGrowth) * 100).toFixed(1)
    : null

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="mb-5">
        <h3 className="section-title">Monthly Income</h3>
        <p className="text-xs text-ink-muted mt-0.5">Gumroad estimate this month</p>
      </div>

      {/* Total */}
      <div className="flex items-end gap-2 mb-1">
        <span className="text-4xl font-black text-ink tracking-tight leading-none">
          {formatCurrency(total)}
        </span>
        {growthPct !== null && (
          <span className="text-emerald-400 text-sm font-semibold mb-1 flex items-center gap-0.5">
            <TrendingUp size={12} />
            +{growthPct}%
          </span>
        )}
      </div>
      <p className="text-xs text-ink-muted mb-5">vs last month</p>

      {/* Breakdown */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#ff90e820' }}>
            <ShoppingBag size={13} style={{ color: '#ff90e8' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-secondary">Gumroad Sales</span>
              <span className="text-xs font-bold text-ink">{formatCurrency(total)}</span>
            </div>
            <div className="progress-bar-bg h-1.5">
              <div className="h-full rounded-full w-full" style={{ background: '#ff90e8' }} />
            </div>
            <p className="text-xs text-ink-muted mt-1">{formatNumber(latest?.gumroad?.sales || 0)} sales tracked</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-muted mt-4 pt-4 border-t border-surface-border">
        Based on your Gumroad revenue data
      </p>
    </div>
  )
}
