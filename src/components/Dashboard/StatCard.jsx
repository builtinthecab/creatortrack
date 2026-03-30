import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatNumber } from '../../utils/storage'

export default function StatCard({ platform, icon: Icon, color, label, primary, primaryLabel, secondary, secondaryLabel, growth, accentGlow }) {
  const growthNum = parseFloat(growth)
  const isPositive = growthNum > 0
  const isNeutral = growthNum === 0 || isNaN(growthNum)

  return (
    <div
      className="card gradient-border p-5 relative overflow-hidden transition-all duration-300 hover:border-surface-border-bright group cursor-default"
      style={accentGlow ? { '--glow-color': color + '18' } : {}}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: color + '15' }}
      />

      {/* Platform header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: color + '20', border: `1px solid ${color}30` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-xs font-bold text-ink-secondary uppercase tracking-widest">{label}</span>
        </div>

        {/* Growth badge */}
        {!isNeutral && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-red-400 bg-red-400/10'
            }`}
          >
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? '+' : ''}{growth}%
          </span>
        )}
      </div>

      {/* Primary metric */}
      <div className="mb-3">
        <div className="text-3xl font-black text-ink tracking-tight leading-none mb-0.5">
          {typeof primary === 'number' ? formatNumber(primary) : primary}
        </div>
        <div className="text-xs font-medium text-ink-muted uppercase tracking-widest">{primaryLabel}</div>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-border mb-3" />

      {/* Secondary metric */}
      <div>
        <div className="text-base font-bold text-ink-secondary">
          {typeof secondary === 'number' ? formatNumber(secondary) : secondary}
        </div>
        <div className="text-xs text-ink-muted">{secondaryLabel}</div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
    </div>
  )
}
