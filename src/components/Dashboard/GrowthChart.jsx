import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { formatNumber } from '../../utils/storage'

const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', metric: 'followers', color: '#ff0050' },
  { key: 'youtube', label: 'YouTube', metric: 'subscribers', color: '#ff4444' },
  { key: 'instagram', label: 'Instagram', metric: 'followers', color: '#e1306c' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-elevated border border-surface-border rounded-xl p-3 shadow-2xl min-w-[140px]">
      <p className="text-xs font-semibold text-ink-muted mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-ink-secondary">{entry.name}</span>
          </div>
          <span className="font-bold text-ink">{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function GrowthChart({ history }) {
  const [activePlatforms, setActivePlatforms] = useState(['tiktok', 'youtube', 'instagram'])

  const dates = Object.keys(history).sort()
  const last30 = dates.slice(-30)

  const data = last30.map(date => {
    const d = history[date]
    const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      date: label,
      tiktok: d?.tiktok?.followers ?? 0,
      youtube: d?.youtube?.subscribers ?? 0,
      instagram: d?.instagram?.followers ?? 0,
    }
  })

  const togglePlatform = (key) => {
    setActivePlatforms(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    )
  }

  const formatYAxis = (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K'
    return v
  }

  return (
    <div className="card p-6 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="section-title">Follower Growth</h3>
          <p className="text-xs text-ink-muted mt-0.5">Last 30 days</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => togglePlatform(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={
                activePlatforms.includes(key)
                  ? { background: color + '20', border: `1px solid ${color}40`, color }
                  : { background: '#1e1e2e', border: '1px solid #2e2e42', color: '#555568' }
              }
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activePlatforms.includes(key) ? color : '#555568' }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#555568', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#555568', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2e2e42', strokeWidth: 1 }} />
            {PLATFORMS.map(({ key, label, color }) =>
              activePlatforms.includes(key) ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#13131f' }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
