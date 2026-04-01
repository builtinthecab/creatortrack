// Initiates Gumroad OAuth — browser is redirected here from the Settings page
export default function handler(req, res) {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!process.env.GUMROAD_CLIENT_ID) return res.status(500).json({ error: 'GUMROAD_CLIENT_ID not configured' })

  const params = new URLSearchParams({
    client_id: process.env.GUMROAD_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL}/api/oauth/gumroad-callback`,
    scope: 'view_sales',
    state: userId,
  })

  res.redirect(`https://gumroad.com/oauth/authorize?${params}`)
}
