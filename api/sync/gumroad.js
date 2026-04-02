import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Fetch every sale from Gumroad, paginating through all pages
async function fetchAllSales(accessToken) {
  const sales = []
  let pageKey = null

  while (true) {
    const url = new URL('https://api.gumroad.com/v2/sales')
    if (pageKey) url.searchParams.set('page_key', pageKey)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`Gumroad sales API error: ${res.status}`)

    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'Gumroad API returned failure')

    sales.push(...(data.sales || []))

    if (!data.next_page_key) break
    pageKey = data.next_page_key
  }

  return sales
}

// Parse sale revenue — Gumroad returns price in cents
function saleRevenue(sale) {
  return (sale.price || 0) / 100
}

// Local date string in YYYY-MM-DD without UTC conversion
function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Accept either the CRON_SECRET (scheduled jobs) or a valid Supabase user JWT
async function authorize(req, bodyUserId) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return false
  if (token === process.env.CRON_SECRET) return true
  // Validate Supabase JWT and confirm it belongs to the requesting user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return false
  return user.id === bodyUserId
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  if (!(await authorize(req, userId))) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get stored access token
    const { data: conn, error: connErr } = await supabase
      .from('platform_connections')
      .select('access_token')
      .eq('user_id', userId)
      .eq('platform', 'gumroad')
      .single()

    if (connErr || !conn) return res.status(404).json({ error: 'No Gumroad connection found' })

    const allSales = await fetchAllSales(conn.access_token)
    const validSales = allSales.filter(s => !s.refunded)

    // Build 30-day date range
    const today = new Date()
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (29 - i))
      return localDate(d)
    })

    const thirtyDaysAgo = dates[0]
    const todayStr = dates[dates.length - 1]

    // Fetch existing stats for the window to preserve other platform data
    const { data: existingRows } = await supabase
      .from('stats')
      .select('date, platform_data')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo)
      .lte('date', todayStr)

    const existing = {}
    for (const row of existingRows || []) existing[row.date] = row.platform_data

    // For each date, compute cumulative Gumroad totals up to end of that day
    const upsertRows = dates.map(dateStr => {
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
      const salesUpToDate = validSales.filter(s => new Date(s.created_at) <= endOfDay)

      return {
        user_id: userId,
        date: dateStr,
        platform_data: {
          ...(existing[dateStr] || {}),
          gumroad: {
            sales: salesUpToDate.length,
            revenue: Math.round(salesUpToDate.reduce((sum, s) => sum + saleRevenue(s), 0) * 100) / 100,
          },
        },
      }
    })

    const { error: upsertErr } = await supabase
      .from('stats')
      .upsert(upsertRows, { onConflict: 'user_id,date' })

    if (upsertErr) throw upsertErr

    // Record sync time
    await supabase
      .from('platform_connections')
      .update({ last_synced_at: new Date().toISOString(), sync_error: null })
      .eq('user_id', userId)
      .eq('platform', 'gumroad')

    return res.json({ success: true, salesSynced: validSales.length, daysWritten: upsertRows.length })
  } catch (err) {
    console.error('Gumroad sync error:', err)
    await supabase
      .from('platform_connections')
      .update({ sync_error: err.message })
      .eq('user_id', userId)
      .eq('platform', 'gumroad')

    return res.status(500).json({ error: err.message })
  }
}
