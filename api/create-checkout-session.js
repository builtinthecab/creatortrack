import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { STRIPE_SECRET_KEY, STRIPE_PRICE_ID, APP_URL, VERCEL_URL } = process.env

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)

  // Parse body — Vercel may deliver as string or object
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { userId, userEmail } = body || {}

  if (!userEmail) {
    return res.status(400).json({ error: 'userEmail is required' })
  }

  const baseUrl = APP_URL || (VERCEL_URL ? `https://${VERCEL_URL}` : 'http://localhost:5173')

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId || null,
      success_url: `${baseUrl}/pricing?success=true`,
      cancel_url:  `${baseUrl}/pricing?canceled=true`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
