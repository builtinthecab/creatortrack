import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

const perks = [
  'Track TikTok, YouTube, Instagram & Gumroad',
  '30-day growth charts & analytics',
  'Goal tracker with progress bars',
  'Daily posting streak tracker',
]

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(form.name.trim(), form.email.trim().toLowerCase(), form.password)
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg bg-grid flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl animate-slide-up">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: perks */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(255,107,26,0.4)' }}>
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight">
                Creator<span className="text-brand-orange">Track</span>
              </span>
            </div>
            <h1 className="text-3xl font-bold text-ink mb-3 leading-tight">
              Your creator empire,<br />all in one place.
            </h1>
            <p className="text-ink-secondary mb-8">
              Join creators who track their growth, income, and goals with CreatorTrack.
            </p>
            <ul className="space-y-3">
              {perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <div className="w-5 h-5 rounded-full bg-brand-orange-glow border border-brand-orange-border flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-brand-orange" />
                  </div>
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form */}
          <div>
            <div className="text-center mb-6 md:hidden">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-orange flex items-center justify-center">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <span className="font-bold text-xl">Creator<span className="text-brand-orange">Track</span></span>
              </div>
            </div>

            <div className="card gradient-border p-8">
              <h2 className="text-xl font-bold text-ink mb-1">Create your account</h2>
              <p className="text-ink-secondary text-sm mb-6">Free to start — no credit card required</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alex Rivera" required className="input-field pl-10" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required className="input-field pl-10" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" required className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat password" required className="input-field pl-10" />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)', boxShadow: '0 4px 20px rgba(255,107,26,0.3)' }}
                >
                  {loading ? 'Creating account...' : 'Create free account'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="text-center text-sm text-ink-secondary mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-orange hover:text-orange-400 font-semibold transition-colors">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
