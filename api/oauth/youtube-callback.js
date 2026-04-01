import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { code, state: userId, error: oauthError } = req.query

  if (oauthError || !code || !userId) {
    return res.redirect(`${process.env.APP_URL}/settings?error=youtube_denied`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/oauth/youtube-callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token in Google response')

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    // Get YouTube channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )
    const channelData = await channelRes.json()
    const channel = channelData.items?.[0]

    const { error: dbError } = await supabase
      .from('platform_connections')
      .upsert({
        user_id: userId,
        platform: 'youtube',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        platform_user_id: channel?.id,
        platform_username: channel?.snippet?.title,
      }, { onConflict: 'user_id,platform' })

    if (dbError) throw dbError

    // Kick off initial sync
    fetch(`${process.env.APP_URL}/api/sync/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ userId }),
    }).catch(() => {})

    res.redirect(`${process.env.APP_URL}/settings?connected=youtube`)
  } catch (err) {
    console.error('YouTube callback error:', err)
    res.redirect(`${process.env.APP_URL}/settings?error=youtube_failed`)
  }
}
