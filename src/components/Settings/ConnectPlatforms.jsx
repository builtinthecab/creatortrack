import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Youtube, ShoppingBag, Check, Unlink, RefreshCw, AlertCircle, Zap } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'gumroad',
    label: 'Gumroad',
    icon: ShoppingBag,
    color: '#ff90e8',
    description: 'Auto-sync total sales and revenue daily.',
    connectPath: '/api/oauth/gumroad-connect',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: '#ff4444',
    description: 'Auto-sync subscriber count and total views daily.',
    connectPath: '/api/oauth/youtube-connect',
  },
]

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ConnectPlatforms() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [connections, setConnections] = useState({})
  const [syncing, setSyncing] = useState({})
  const [disconnecting, setDisconnecting] = useState({})
  const [banner, setBanner] = useState(null)

  // Handle OAuth redirects back to this page
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected) {
      setBanner({ type: 'success', message: `${connected} connected successfully! Syncing your data…` })
      setSearchParams({})
      loadConnections()
    } else if (error) {
      const messages = {
        gumroad_denied: 'Gumroad authorization was cancelled.',
        gumroad_failed: 'Failed to connect Gumroad. Please try again.',
        youtube_denied: 'YouTube authorization was cancelled.',
        youtube_failed: 'Failed to connect YouTube. Please try again.',
      }
      setBanner({ type: 'error', message: messages[error] || 'Something went wrong.' })
      setSearchParams({})
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadConnections() {
    const { data } = await supabase
      .from('platform_connections')
      .select('platform, platform_username, last_synced_at, sync_error')
      .eq('user_id', user.id)

    const map = {}
    for (const row of data || []) map[row.platform] = row
    setConnections(map)
  }

  useEffect(() => { loadConnections() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleConnect(platform) {
    window.location.href = `${platform.connectPath}?userId=${user.id}`
  }

  async function handleDisconnect(platformId) {
    setDisconnecting(d => ({ ...d, [platformId]: true }))
    await supabase
      .from('platform_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platformId)
    setConnections(c => { const n = { ...c }; delete n[platformId]; return n })
    setDisconnecting(d => ({ ...d, [platformId]: false }))
  }

  async function handleSync(platformId) {
    setSyncing(s => ({ ...s, [platformId]: true }))
    try {
      const res = await fetch(`/api/sync/${platformId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_CRON_SECRET}`,
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBanner({ type: 'success', message: `${platformId} synced successfully!` })
      await loadConnections()
    } catch (err) {
      setBanner({ type: 'error', message: `Sync failed: ${err.message}` })
    } finally {
      setSyncing(s => ({ ...s, [platformId]: false }))
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Connected Platforms</h1>
        <p className="text-ink-secondary text-sm">
          Connect your accounts to auto-sync stats daily. TikTok and Instagram require manual entry for now.
        </p>
      </div>

      {banner && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {banner.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {banner.message}
          <button onClick={() => setBanner(null)} className="ml-auto text-ink-muted hover:text-ink">✕</button>
        </div>
      )}

      <div className="space-y-4">
        {PLATFORMS.map(platform => {
          const { id, label, icon: Icon, color, description } = platform
          const conn = connections[id]
          const isConnected = !!conn

          return (
            <div key={id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: color + '20', border: `1px solid ${color}40` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-ink">{label}</p>
                      {isConnected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check size={10} />Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-secondary">{description}</p>
                    {isConnected && (
                      <div className="mt-1.5 space-y-0.5">
                        {conn.platform_username && (
                          <p className="text-xs text-ink-muted">Account: <span className="text-ink-secondary">{conn.platform_username}</span></p>
                        )}
                        {conn.last_synced_at ? (
                          <p className="text-xs text-ink-muted">Last synced: <span className="text-ink-secondary">{formatDate(conn.last_synced_at)}</span></p>
                        ) : (
                          <p className="text-xs text-ink-muted">Syncing for the first time…</p>
                        )}
                        {conn.sync_error && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle size={10} /> {conn.sync_error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(id)}
                        disabled={syncing[id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:text-ink hover:bg-surface-elevated border border-surface-border transition-all disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={syncing[id] ? 'animate-spin' : ''} />
                        {syncing[id] ? 'Syncing…' : 'Sync now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(id)}
                        disabled={disconnecting[id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-400/10 border border-red-400/20 transition-all disabled:opacity-50"
                      >
                        <Unlink size={13} />
                        {disconnecting[id] ? 'Removing…' : 'Disconnect'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                    >
                      <Zap size={14} />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Manual platforms — coming soon */}
        {['TikTok', 'Instagram'].map(name => (
          <div key={name} className="card p-6 opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
                <span className="text-lg">{name === 'TikTok' ? '🎵' : '📷'}</span>
              </div>
              <div>
                <p className="font-semibold text-ink">{name}</p>
                <p className="text-xs text-ink-muted">API access restricted — manual entry only for now.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
