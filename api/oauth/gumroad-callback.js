import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { code, state: userId, error: oauthError } = req.query

  if (oauthError || !code || !userId) {
    return res.redirect(`${process.env.APP_URL}/settings?error=gumroad_denied`)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://api.gumroad.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GUMROAD_CLIENT_ID,
        client_secret: process.env.GUMROAD_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/oauth/gumroad-callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token in Gumroad response')

    // Get Gumroad account info
    const userRes = await fetch('https://api.gumroad.com/v2/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const userData = await userRes.json()
    const grUser = userData.user || {}

    // Store connection (service role bypasses RLS)
    const { error: dbError } = await supabase
      .from('platform_connections')
      .upsert({
        user_id: userId,
        platform: 'gumroad',
        access_token: tokenData.access_token,
        platform_user_id: grUser.id || grUser.profile_url,
        platform_username: grUser.name || grUser.email,
      }, { onConflict: 'user_id,platform' })

    if (dbError) throw dbError

    // Kick off initial sync (fire-and-forget — don't await so redirect is fast)
    fetch(`${process.env.APP_URL}/api/sync/gumroad`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ userId }),
    }).catch(() => {})

    res.redirect(`${process.env.APP_URL}/settings?connected=gumroad`)
  } catch (err) {
    console.error('Gumroad callback error:', err)
    res.redirect(`${process.env.APP_URL}/settings?error=gumroad_failed`)
  }
}
