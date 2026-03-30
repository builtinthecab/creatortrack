import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email.trim().toLowerCase(), form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg bg-grid flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(255,107,26,0.4)' }}>
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">
              Creator<span className="text-brand-orange">Track</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Welcome back</h1>
          <p className="text-ink-secondary text-sm">Sign in to your creator dashboard</p>
        </div>

        <div className="card gradient-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)', boxShadow: '0 4px 20px rgba(255,107,26,0.3)' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-orange hover:text-orange-400 font-semibold transition-colors">
              Start free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          <Link to="/pricing" className="hover:text-ink-secondary transition-colors">View pricing</Link>
          {' · '}
          <span>No credit card required to start</span>
        </p>
      </div>
    </div>
  )
}
