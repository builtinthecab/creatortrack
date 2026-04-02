import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Check, TrendingUp, Zap, Shield, BarChart2, Target, Flame, Cloud,
  RefreshCw, Bell, ArrowRight, Star, CreditCard, X
} from 'lucide-react'

const features = [
  { icon: BarChart2, text: 'Track TikTok, YouTube, Instagram & Gumroad' },
  { icon: TrendingUp, text: '30-day growth charts & trend analysis' },
  { icon: Target,    text: 'Custom goals with progress tracking' },
  { icon: Flame,     text: 'Daily posting streak counter' },
  { icon: Cloud,     text: 'Cloud sync — your data on every device' },
  { icon: Shield,    text: 'Secure Supabase cloud storage' },
  { icon: Bell,      text: 'Milestone alerts & notifications (coming soon)' },
  { icon: RefreshCw, text: 'Automated Gumroad & YouTube sync — no manual entry' },
]

const testimonials = [
  { name: 'Jamie K.',  handle: '@jamiecreates',  quote: "I used to open 4 tabs every morning. Now it's one. Game changer.",                   avatar: 'JK' },
  { name: 'Marcus T.', handle: '@marcusbuilds',  quote: 'The streak tracker alone got me to post consistently for 60 days straight.',          avatar: 'MT' },
  { name: 'Sofia R.',  handle: '@sofiadesigns',  quote: 'Finally I can show brands my multi-platform growth in one screenshot.',               avatar: 'SR' },
]

const faq = [
  { q: 'Can I cancel anytime?',            a: 'Yes. Cancel from your Stripe billing portal — no questions asked. Your data stays accessible until the end of the billing period.' },
  { q: 'What payment methods are accepted?', a: 'All major credit and debit cards via Stripe. Your payment info never touches our servers.' },
  { q: 'Is there a free trial?',            a: 'Yes — the free plan lets you explore the full dashboard with your data. Upgrade when you\'re ready.' },
  { q: 'Do you store my platform passwords?', a: 'Never. OAuth connections use short-lived access tokens granted directly by Gumroad and Google — we never see your passwords. You can revoke access at any time from the Connect page.' },
]

export default function Pricing() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [searchParams] = useSearchParams()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError,   setCheckoutError]   = useState('')

  const success  = searchParams.get('success')  === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  const isPro = user?.subscription_status === 'pro'

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signup')
      return
    }
    if (isPro) {
      navigate('/dashboard')
      return
    }

    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setCheckoutError(err.message)
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Nav */}
      <header className="border-b border-surface-border bg-surface-bg/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={user?.onboarded ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">Creator<span className="text-brand-orange">Track</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {user?.onboarded ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-brand-orange hover:opacity-90">
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login"  className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors">Sign in</Link>
                <Link to="/signup" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#ff6b1a' }}>
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Success / Canceled banners */}
        {success && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <Check size={18} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">
              Payment successful — you're now on Pro! Redirecting to your dashboard…
            </p>
          </div>
        )}
        {canceled && (
          <div className="mb-8 p-4 bg-surface-elevated border border-surface-border rounded-xl flex items-center gap-3">
            <X size={18} className="text-ink-muted flex-shrink-0" />
            <p className="text-sm text-ink-secondary">Checkout canceled. You can upgrade any time.</p>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.25)', color: '#ff6b1a' }}>
            <Zap size={11} />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-black text-ink tracking-tight mb-4">
            One plan.<br />
            <span className="text-gradient-orange">Everything you need.</span>
          </h1>
          <p className="text-xl text-ink-secondary max-w-xl mx-auto">
            Built for serious creators who want to grow faster and track smarter.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-20">

          {/* Free */}
          <div className="card p-8">
            <div className="mb-6">
              <p className="text-xs font-bold text-ink-secondary uppercase tracking-widest mb-2">Free</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-ink">$0</span>
                <span className="text-ink-muted mb-2">/month</span>
              </div>
              <p className="text-ink-secondary text-sm">Get started — no credit card needed.</p>
            </div>
            <ul className="space-y-3 mb-8">
              {['Manual stat logging', '30-day growth charts', 'Goal tracker', 'Posting streak'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <Check size={14} className="text-brand-orange flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {!user ? (
              <Link to="/signup" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-ink-secondary border border-surface-border-bright hover:border-brand-orange hover:text-brand-orange transition-all duration-200 text-sm">
                Start free <ArrowRight size={15} />
              </Link>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-ink-muted border border-surface-border text-sm cursor-default">
                {isPro ? 'Previous plan' : 'Current plan'}
              </div>
            )}
          </div>

          {/* Pro */}
          <div className="card gradient-border p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d0d1a, #13131f)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,107,26,0.15)', border: '1px solid rgba(255,107,26,0.35)', color: '#ff6b1a' }}>
                <Star size={10} fill="currentColor" />
                Most popular
              </span>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-2">Pro</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-ink">$19.99</span>
                <span className="text-ink-muted mb-2">/month</span>
              </div>
              <p className="text-ink-secondary text-sm">Everything in free, plus cloud sync and priority features.</p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <div className="w-5 h-5 rounded-full bg-brand-orange-glow border border-brand-orange-border flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-brand-orange" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                {checkoutError}
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading || isPro}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)', boxShadow: '0 4px 24px rgba(255,107,26,0.35)' }}
            >
              {checkoutLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting to checkout…</>
              ) : isPro ? (
                <><Check size={16} /> You're on Pro</>
              ) : (
                <><CreditCard size={16} /> Subscribe — $19.99/mo</>
              )}
            </button>

            <p className="text-center text-xs text-ink-muted mt-3">
              <Shield size={10} className="inline mr-1" />
              Secured by Stripe · Cancel anytime
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-ink text-center mb-10">What creators are saying</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map(({ name, handle, quote, avatar }) => (
              <div key={name} className="card p-6">
                <div className="flex mb-3">
                  {[0,1,2,3,4].map(i => <Star key={i} size={13} fill="#ff6b1a" className="text-brand-orange" />)}
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed mb-4">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-xs font-bold text-white">{avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{name}</p>
                    <p className="text-xs text-ink-muted">{handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-8">Common questions</h2>
          <div className="space-y-4">
            {faq.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <p className="text-sm font-semibold text-ink mb-2">{q}</p>
                <p className="text-sm text-ink-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
