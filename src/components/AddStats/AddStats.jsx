import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/db'
import { Music2, Youtube, Instagram, ShoppingBag, Check, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'tiktok', label: 'TikTok', icon: Music2, color: '#ff0050',
    fields: [
      { key: 'followers', label: 'Followers',   placeholder: 'e.g. 125000' },
      { key: 'views',     label: 'Total Views', placeholder: 'e.g. 2100000' },
    ],
  },
  {
    id: 'youtube', label: 'YouTube', icon: Youtube, color: '#ff4444',
    fields: [
      { key: 'subscribers', label: 'Subscribers', placeholder: 'e.g. 45000' },
      { key: 'views',       label: 'Total Views', placeholder: 'e.g. 890000' },
    ],
  },
  {
    id: 'instagram', label: 'Instagram', icon: Instagram, color: '#e1306c',
    fields: [
      { key: 'followers', label: 'Followers',   placeholder: 'e.g. 89000' },
      { key: 'posts',     label: 'Total Posts', placeholder: 'e.g. 342' },
    ],
  },
  {
    id: 'gumroad', label: 'Gumroad', icon: ShoppingBag, color: '#ff90e8',
    fields: [
      { key: 'sales',   label: 'Total Sales',      placeholder: 'e.g. 172',    step: '1' },
      { key: 'revenue', label: 'Total Revenue ($)', placeholder: 'e.g. 3420.00', step: '0.01' },
    ],
  },
]

// Check if a value is a "filled" field (0 is valid, empty string is not)
function hasValue(v) {
  return v !== '' && v !== undefined && v !== null
}

function PlatformSection({ platform, values, onChange }) {
  const [expanded, setExpanded] = useState(true)
  const { id, label, icon: Icon, color, fields } = platform

  const summaryText = fields
    .map(f => hasValue(values[f.key]) ? `${f.label}: ${values[f.key]}` : null)
    .filter(Boolean)
    .join(' · ') || 'Click to enter stats'

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-surface-elevated transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: color + '20', border: `1px solid ${color}30` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-ink text-sm">{label}</p>
            <p className="text-xs text-ink-muted">{summaryText}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-ink-muted" /> : <ChevronDown size={16} className="text-ink-muted" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-border animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {fields.map(({ key, label, placeholder, step }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">{label}</label>
                <input
                  type="number"
                  min="0"
                  step={step || '1'}
                  value={hasValue(values[key]) ? values[key] : ''}
                  onChange={e => onChange(id, key, e.target.value)}
                  placeholder={placeholder}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Returns YYYY-MM-DD in the user's local timezone (not UTC)
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AddStats() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const today     = localDateStr()
  const [date, setDate]             = useState(today)
  const [stats, setStats]           = useState({ tiktok: {}, youtube: {}, instagram: {}, gumroad: {} })
  const [saved, setSaved]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [alsoLogStreak, setAlsoLogStreak] = useState(true)

  const handleChange = (platform, key, value) => {
    setStats(s => ({
      ...s,
      [platform]: {
        ...s[platform],
        // Keep empty string as-is so field clears visually; parse number otherwise
        [key]: value === '' ? '' : Number(value),
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Build the day stats (include platforms with at least one filled field)
      const dayStats = {}
      for (const [platform, values] of Object.entries(stats)) {
        const filledEntries = Object.entries(values).filter(([, v]) => hasValue(v))
        if (filledEntries.length > 0) {
          dayStats[platform] = Object.fromEntries(filledEntries)
        }
      }

      await db.upsertDailyStats(user.id, date, dayStats)

      if (alsoLogStreak) {
        const existing = await db.getStreak(user.id)
        // Compute yesterday in local time (not UTC) to avoid timezone drift
        const yd = new Date()
        yd.setDate(yd.getDate() - 1)
        const yesterday = localDateStr(yd)

        let newCurrent
        if (existing.last_posted === today) {
          // Already logged today — don't double-count
          newCurrent = existing.current
        } else if (existing.last_posted === yesterday) {
          // Consecutive day
          newCurrent = (existing.current || 0) + 1
        } else {
          // Streak broken or first entry
          newCurrent = 1
        }

        await db.upsertStreak(user.id, {
          current:     newCurrent,
          longest:     Math.max(newCurrent, existing.longest || 0),
          last_posted: today,
        })
      }

      setSaved(true)
      setTimeout(() => navigate('/dashboard'), 1400)
    } catch (err) {
      console.error('Save stats error:', err)
      setSaving(false)
    }
  }

  const hasAnyData = Object.values(stats).some(p =>
    Object.values(p).some(v => hasValue(v))
  )

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Log Today's Stats</h1>
        <p className="text-ink-secondary text-sm">Enter your current numbers across all platforms.</p>
      </div>

      {/* Date selector */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <Calendar size={16} className="text-brand-orange flex-shrink-0" />
        <div className="flex-1">
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="input-field"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Platform sections */}
      <div className="space-y-3 mb-6">
        {PLATFORMS.map(platform => (
          <PlatformSection
            key={platform.id}
            platform={platform}
            values={stats[platform.id]}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Streak option */}
      <label className="flex items-center gap-3 p-4 card cursor-pointer hover:border-surface-border-bright transition-colors mb-6">
        <div className="relative">
          <input
            type="checkbox"
            checked={alsoLogStreak}
            onChange={e => setAlsoLogStreak(e.target.checked)}
            className="sr-only"
          />
          <div
            className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
            style={{
              background: alsoLogStreak ? '#ff6b1a' : 'transparent',
              border: alsoLogStreak ? '1px solid #ff6b1a' : '1px solid #2e2e42',
            }}
          >
            {alsoLogStreak && <Check size={11} className="text-white" />}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Count as a posting day 🔥</p>
          <p className="text-xs text-ink-muted">Adds to your daily streak counter</p>
        </div>
      </label>

      {/* Save button */}
      {saved ? (
        <div
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white animate-fade-in"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <Check size={18} />
          Stats saved! Redirecting…
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={!hasAnyData || saving}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)',
            boxShadow: hasAnyData ? '0 4px 20px rgba(255,107,26,0.3)' : 'none',
          }}
        >
          {saving ? 'Saving…' : 'Save Stats'}
        </button>
      )}
    </main>
  )
}
