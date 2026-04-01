import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Called daily by Vercel Cron at 08:00 UTC
// Syncs every user who has a connected platform
export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.authorization?.replace('Bearer ', '')
  if (auth !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: connections, error } = await supabase
    .from('platform_connections')
    .select('user_id, platform')

  if (error) return res.status(500).json({ error: error.message })

  const results = []

  for (const conn of connections || []) {
    try {
      const syncRes = await fetch(`${process.env.APP_URL}/api/sync/${conn.platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ userId: conn.user_id }),
      })
      const data = await syncRes.json()
      results.push({ userId: conn.user_id, platform: conn.platform, success: data.success })
    } catch (err) {
      results.push({ userId: conn.user_id, platform: conn.platform, error: err.message })
    }
  }

  console.log('Daily sync results:', results)
  return res.json({ synced: results.length, results })
}
