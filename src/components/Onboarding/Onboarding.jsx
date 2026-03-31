import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, ArrowRight, ArrowLeft, Music2, Youtube, Instagram, ShoppingBag, Check } from 'lucide-react'

const steps = [
  { title: 'Connect your platforms', subtitle: 'Tell us your usernames so we can keep things organized.' },
  { title: 'Enter your current stats', subtitle: 'These become your baseline — we build your history from here.' },
  { title: "You're all set!", subtitle: 'Your dashboard is ready. Welcome to CreatorTrack.' },
]

function Step1({ form, setForm }) {
  const fields = [
    { key: 'tiktok',    label: 'TikTok',    icon: Music2,    placeholder: '@yourusername',    color: '#ff0050' },
    { key: 'youtube',   label: 'YouTube',   icon: Youtube,   placeholder: 'Your Channel Name', color: '#ff0000' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@yourusername',    color: '#e1306c' },
    { key: 'gumroad',   label: 'Gumroad',   icon: ShoppingBag, placeholder: 'yourstore',    color: '#ff90e8' },
  ]
  return (
    <div className="space-y-4">
      {fields.map(({ key, label, icon: Icon, placeholder, color }) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">{label}</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
              <Icon size={12} style={{ color }} />
            </div>
            <input
              type="text"
              value={form[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="input-field pl-10"
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-ink-muted pt-1">You can skip platforms you don't use — add them later anytime.</p>
    </div>
  )
}

function Step2({ form, setForm }) {
  const fields = [
    { section: 'TikTok', color: '#ff0050', inputs: [
      { key: 'tiktokFollowers',    label: 'Followers',      placeholder: '50000' },
      { key: 'tiktokViews',        label: 'Total Views',    placeholder: '800000' },
    ]},
    { section: 'YouTube', color: '#ff0000', inputs: [
      { key: 'youtubeSubscribers', label: 'Subscribers',    placeholder: '12000' },
      { key: 'youtubeViews',       label: 'Total Views',    placeholder: '250000' },
    ]},
    { section: 'Instagram', color: '#e1306c', inputs: [
      { key: 'instagramFollowers', label: 'Followers',      placeholder: '22000' },
      { key: 'instagramPosts',     label: 'Total Posts',    placeholder: '80' },
    ]},
    { section: 'Gumroad', color: '#ff90e8', inputs: [
      { key: 'gumroadSales',       label: 'Total Sales',    placeholder: '45' },
      { key: 'gumroadRevenue',     label: 'Total Revenue ($)', placeholder: '900' },
    ]},
  ]

  return (
    <div className="space-y-5">
      {fields.map(({ section, color, inputs }) => (
        <div key={section} className="p-4 bg-surface-elevated rounded-xl border border-surface-border">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>{section}</p>
          <div className="grid grid-cols-2 gap-3">
            {inputs.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-ink-muted mb-1.5">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key] !== undefined && form[key] !== '' ? form[key] : ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder={placeholder}
                  className="input-field text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Step3({ userName }) {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-brand-orange-glow border border-brand-orange-border flex items-center justify-center mx-auto mb-5" style={{ boxShadow: '0 0 30px rgba(255,107,26,0.2)' }}>
        <Check size={28} className="text-brand-orange" />
      </div>
      <h3 className="text-xl font-bold text-ink mb-2">Dashboard ready, {userName?.split(' ')[0]}!</h3>
      <p className="text-ink-secondary text-sm leading-relaxed max-w-sm mx-auto">
        We've built your 30-day history and seeded your goals. Everything looks great — let's go track some growth.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
        {[
          ['Dashboard', 'All your stats in one view'],
          ['Add Stats', "Log today's numbers"],
          ['Goals', 'Track your milestones'],
          ['Growth Chart', '30-day trend lines'],
        ].map(([title, desc]) => (
          <div key={title} className="p-3 bg-surface-elevated rounded-lg border border-surface-border">
            <p className="text-xs font-semibold text-brand-orange mb-0.5">{title}</p>
            <p className="text-xs text-ink-muted">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [platforms, setPlatforms] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isLast = step === steps.length - 1

  const handleNext = async () => {
    if (step === 1) {
      setLoading(true)
      setError('')
      try {
        // Normalise values to numbers (empty → 0)
        const normalised = {}
        for (const [k, v] of Object.entries(stats)) {
          normalised[k] = v === '' ? 0 : Number(v)
        }
        await completeOnboarding(platforms, normalised)
        setStep(2)
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    } else if (isLast) {
      navigate('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg bg-grid flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(255,107,26,0.4)' }}>
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">Creator<span className="text-brand-orange">Track</span></span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? '#ff6b1a' : '#1e1e2e' }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="card gradient-border p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold text-brand-orange uppercase tracking-widest mb-1">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="text-xl font-bold text-ink mb-1">{steps[step].title}</h2>
            <p className="text-ink-secondary text-sm">{steps[step].subtitle}</p>
          </div>

          {step === 0 && <Step1 form={platforms} setForm={setPlatforms} />}
          {step === 1 && <Step2 form={stats} setForm={setStats} />}
          {step === 2 && <Step3 userName={user?.name} />}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 0 && step < 2 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)', boxShadow: '0 4px 16px rgba(255,107,26,0.3)' }}
            >
              {loading ? 'Setting up...' : isLast ? 'Go to Dashboard' : step === 1 ? 'Finish Setup' : 'Continue'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
