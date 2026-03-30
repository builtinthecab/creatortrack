import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Read raw body bytes from the request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }

  const stripe   = new Stripe(STRIPE_SECRET_KEY)
  const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session    = event.data.object
      const userId     = session.client_reference_id
      const customerId = session.customer

      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'pro', stripe_customer_id: customerId })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.paused': {
      const customerId = event.data.object.customer
      await supabase
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('stripe_customer_id', customerId)
      break
    }

    default:
      // Ignore other events
  }

  return res.status(200).json({ received: true })
}
