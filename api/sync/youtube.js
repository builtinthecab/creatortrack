import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Refresh Google access token using stored refresh token
async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to refresh Google token')
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }
}

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization?.replace('Bearer ', '')
  if (authHeader !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    const { data: conn, error: connErr } = await supabase
      .from('platform_connections')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .single()

    if (connErr || !conn) return res.status(404).json({ error: 'No YouTube connection found' })

    // Refresh token if expired or expiring within 5 minutes
    let accessToken = conn.access_token
    const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : new Date(0)

    if (expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
      const refreshed = await refreshAccessToken(conn.refresh_token)
      accessToken = refreshed.access_token

      await supabase
        .from('platform_connections')
        .update({ access_token: accessToken, token_expires_at: refreshed.expires_at })
        .eq('user_id', userId)
        .eq('platform', 'youtube')
    }

    // Fetch current channel statistics
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!channelRes.ok) throw new Error(`YouTube API error: ${channelRes.status}`)

    const channelData = await channelRes.json()
    const stats = channelData.items?.[0]?.statistics

    if (!stats) throw new Error('No channel statistics returned from YouTube')

    const subscribers = parseInt(stats.subscriberCount || '0', 10)
    const views = parseInt(stats.viewCount || '0', 10)

    const todayStr = localDate(new Date())

    // Fetch today's existing stats to preserve other platform data
    const { data: existing } = await supabase
      .from('stats')
      .select('platform_data')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .single()

    const platformData = {
      ...(existing?.platform_data || {}),
      youtube: { subscribers, views },
    }

    await supabase
      .from('stats')
      .upsert({ user_id: userId, date: todayStr, platform_data: platformData }, { onConflict: 'user_id,date' })

    await supabase
      .from('platform_connections')
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq('user_id', userId)
      .eq('platform', 'youtube')

    return res.json({ success: true, subscribers, views })
  } catch (err) {
    console.error('YouTube sync error:', err)
    await supabase
      .from('platform_connections')
      .update({ sync_error: err.message })
      .eq('user_id', userId)
      .eq('platform', 'youtube')

    return res.status(500).json({ error: err.message })
  }
}
