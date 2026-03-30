import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/db'
import { getGrowthPercent, formatCurrency, formatNumber } from '../../utils/storage'
import StatCard from './StatCard'
import GrowthChart from './GrowthChart'
import IncomeCard from './IncomeCard'
import StreakCard from './StreakCard'
import GoalsCard from './GoalsCard'
import { Music2, Youtube, Instagram, ShoppingBag, PlusCircle, RefreshCw } from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 w-24 bg-surface-elevated rounded mb-4" />
      <div className="h-8 w-32 bg-surface-elevated rounded mb-2" />
      <div className="h-px bg-surface-border my-3" />
      <div className="h-4 w-20 bg-surface-elevated rounded" />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [history, setHistory]   = useState({})
  const [goals, setGoals]       = useState([])
  const [streak, setStreak]     = useState({ current: 0, longest: 0 })
  const [dashLoading, setDashLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [h, g, s] = await Promise.all([
          db.getStats(user.id),
          db.getGoals(user.id),
          db.getStreak(user.id),
        ])
        if (!cancelled) {
          setHistory(h)
          setGoals(g)
          setStreak(s)
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        if (!cancelled) setDashLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.id])

  const dates  = Object.keys(history).sort()
  const latest = history[dates[dates.length - 1]] || {}
  const lastUpdated = dates[dates.length - 1]
    ? new Date(dates[dates.length - 1] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No data yet'

  const tiktok    = latest?.tiktok    || {}
  const youtube   = latest?.youtube   || {}
  const instagram = latest?.instagram || {}
  const gumroad   = latest?.gumroad   || {}

  const ttGrowth = getGrowthPercent(history, 'tiktok', 'followers')
  const ytGrowth = getGrowthPercent(history, 'youtube', 'subscribers')
  const igGrowth = getGrowthPercent(history, 'instagram', 'followers')
  const grGrowth = getGrowthPercent(history, 'gumroad', 'revenue')

  const hasData = dates.length > 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {getGreeting()}, {user.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-ink-secondary text-sm mt-1">
            Last updated: <span className="font-medium">{lastUpdated}</span>
            {' · '}
            <span className="text-ink-muted">{dates.length} data points</span>
          </p>
        </div>
        <Link
          to="/add-stats"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm whitespace-nowrap transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)', boxShadow: '0 4px 16px rgba(255,107,26,0.25)' }}
        >
          <PlusCircle size={15} />
          Log Today's Stats
        </Link>
      </div>

      {/* No data banner */}
      {!dashLoading && !hasData && (
        <div className="mb-6 p-4 bg-brand-orange-glow border border-brand-orange-border rounded-xl flex items-center gap-3">
          <RefreshCw size={16} className="text-brand-orange flex-shrink-0" />
          <p className="text-sm text-ink-secondary">
            No stats yet.{' '}
            <Link to="/add-stats" className="text-brand-orange font-semibold hover:underline">
              Log your first entry
            </Link>{' '}
            to start tracking growth.
          </p>
        </div>
      )}

      {/* Platform stat cards */}
      {dashLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="TikTok"    icon={Music2}    color="#ff0050" primary={tiktok.followers || 0}    primaryLabel="Followers"     secondary={tiktok.views || 0}      secondaryLabel="Total Views"  growth={ttGrowth} />
          <StatCard label="YouTube"   icon={Youtube}   color="#ff4444" primary={youtube.subscribers || 0} primaryLabel="Subscribers"   secondary={youtube.views || 0}     secondaryLabel="Total Views"  growth={ytGrowth} />
          <StatCard label="Instagram" icon={Instagram} color="#e1306c" primary={instagram.followers || 0} primaryLabel="Followers"     secondary={instagram.posts || 0}   secondaryLabel="Total Posts"  growth={igGrowth} />
          <StatCard label="Gumroad"   icon={ShoppingBag} color="#ff90e8" primary={`$${(gumroad.revenue || 0).toLocaleString()}`} primaryLabel="Total Revenue" secondary={gumroad.sales || 0} secondaryLabel="Total Sales" growth={grGrowth} />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2">
          <GrowthChart history={history} />
        </div>
        <div>
          <IncomeCard history={history} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StreakCard streak={streak} />
        <div className="md:col-span-1 xl:col-span-2">
          <GoalsCard goals={goals} latestStats={latest} userId={user.id} />
        </div>
      </div>

      {/* Totals summary bar */}
      <div className="mt-6 card p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <p className="stat-label mb-0.5">Total Followers</p>
            <p className="text-lg font-bold text-ink">
              {formatNumber((tiktok.followers || 0) + (youtube.subscribers || 0) + (instagram.followers || 0))}
            </p>
          </div>
          <div className="w-px bg-surface-border hidden sm:block" />
          <div>
            <p className="stat-label mb-0.5">Total Views</p>
            <p className="text-lg font-bold text-ink">
              {formatNumber((tiktok.views || 0) + (youtube.views || 0))}
            </p>
          </div>
          <div className="w-px bg-surface-border hidden sm:block" />
          <div>
            <p className="stat-label mb-0.5">Gumroad Revenue</p>
            <p className="text-lg font-bold text-ink">{formatCurrency(gumroad.revenue || 0)}</p>
          </div>
          <div className="w-px bg-surface-border hidden sm:block" />
          <div>
            <p className="stat-label mb-0.5">Posting Streak</p>
            <p className="text-lg font-bold text-ink">{streak.current || 0} days 🔥</p>
          </div>
          <div className="ml-auto flex items-center">
            <span className="text-xs text-ink-muted">
              {user.subscription_status === 'pro'
                ? '✦ Pro plan — cloud sync active'
                : <><Link to="/pricing" className="text-brand-orange hover:underline">Upgrade to Pro</Link> for priority support</>
              }
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
