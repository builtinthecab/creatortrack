import { Flame, Zap, Calendar } from 'lucide-react'

function StreakDot({ active, today }) {
  return (
    <div
      className={`w-3 h-3 rounded-full transition-all duration-300 ${
        today
          ? 'ring-2 ring-brand-orange ring-offset-1 ring-offset-surface-card'
          : ''
      }`}
      style={{
        background: active
          ? today
            ? '#ff6b1a'
            : 'linear-gradient(135deg, #ff6b1a, #ff8c45)'
          : '#1e1e2e',
        boxShadow: active ? '0 0 6px rgba(255,107,26,0.4)' : 'none',
      }}
    />
  )
}

export default function StreakCard({ streak }) {
  const { current = 7, longest = 14 } = streak

  // Build last 21 days grid
  const days = Array.from({ length: 21 }, (_, i) => {
    const daysAgo = 20 - i
    return {
      active: daysAgo < current,
      today: daysAgo === 0,
    }
  })

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Posting Streak</h3>
          <p className="text-xs text-ink-muted mt-0.5">Keep it going!</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.25)' }}
        >
          <Flame size={14} className="text-brand-orange" />
          <span className="text-sm font-bold text-brand-orange">{current} days</span>
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <div className="text-5xl font-black tracking-tight leading-none" style={{ color: '#ff6b1a', textShadow: '0 0 30px rgba(255,107,26,0.3)' }}>
            {current}
          </div>
          <div className="text-xs font-medium text-ink-muted uppercase tracking-widest mt-1">day streak</div>
        </div>
        <div className="pb-1 border-l border-surface-border pl-4">
          <div className="text-xl font-bold text-ink">{longest}</div>
          <div className="text-xs text-ink-muted">personal best</div>
        </div>
      </div>

      {/* Day grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-xs text-ink-faint font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, i) => (
            <div key={i} className="flex justify-center">
              <StreakDot active={day.active} today={day.today} />
            </div>
          ))}
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-4 pt-4 border-t border-surface-border">
        {current >= longest ? (
          <div className="flex items-center gap-2 text-xs">
            <Zap size={12} className="text-brand-orange" />
            <span className="text-brand-orange font-semibold">New personal best!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <Calendar size={12} className="text-ink-muted" />
            <span className="text-ink-muted">{longest - current} more days to beat your record</span>
          </div>
        )}
      </div>
    </div>
  )
}
