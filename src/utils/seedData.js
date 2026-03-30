// Generates 30 days of realistic historical data seeded from current stats
export function generateSeedHistory(currentStats) {
  const history = {}
  const today = new Date()

  const {
    tiktokFollowers = 50000,
    tiktokViews = 800000,
    youtubeSubscribers = 12000,
    youtubeViews = 250000,
    instagramFollowers = 22000,
    instagramPosts = 80,
    gumroadSales = 45,
    gumroadRevenue = 900,
  } = currentStats

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]

    // Growth factor: older entries are smaller (simulate natural growth)
    const factor = 1 - (i / 30) * 0.18
    const jitter = () => 1 + (Math.random() - 0.5) * 0.015

    history[dateKey] = {
      tiktok: {
        followers: Math.round(tiktokFollowers * factor * jitter()),
        views: Math.round(tiktokViews * factor * jitter()),
      },
      youtube: {
        subscribers: Math.round(youtubeSubscribers * factor * jitter()),
        views: Math.round(youtubeViews * factor * jitter()),
      },
      instagram: {
        followers: Math.round(instagramFollowers * factor * jitter()),
        posts: Math.round(instagramPosts * factor),
      },
      gumroad: {
        sales: Math.round(gumroadSales * factor * jitter()),
        revenue: Math.round(gumroadRevenue * factor * jitter() * 100) / 100,
      },
    }
  }

  return history
}

export const DEFAULT_GOALS = [
  { id: '1', label: 'TikTok 100K Followers', platform: 'tiktok', metric: 'followers', target: 100000 },
  { id: '2', label: 'YouTube 50K Subscribers', platform: 'youtube', metric: 'subscribers', target: 50000 },
  { id: '3', label: 'Monthly Revenue $5,000', platform: 'gumroad', metric: 'revenue', target: 5000, isMonthly: true },
]

export const DEMO_USER = {
  id: 'demo-001',
  name: 'Alex Rivera',
  email: 'demo@creatortrack.io',
  platforms: {
    tiktok: '@alexrivera',
    youtube: 'Alex Rivera',
    instagram: '@alex.rivera',
    gumroad: 'alexrivera',
  },
  onboarded: true,
  createdAt: new Date().toISOString(),
}
