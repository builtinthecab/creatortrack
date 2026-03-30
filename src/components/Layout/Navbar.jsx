import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, PlusCircle, Target, CreditCard, LogOut, Menu, X, TrendingUp, ChevronDown } from 'lucide-react'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add-stats', label: 'Add Stats', icon: PlusCircle },
  { to: '/pricing', label: 'Pricing', icon: CreditCard },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CT'

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center shadow-lg group-hover:shadow-brand-orange/30 transition-shadow">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Creator<span className="text-brand-orange">Track</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-brand-orange-glow text-brand-orange border border-brand-orange-border'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-elevated transition-colors border border-transparent hover:border-surface-border"
              >
                <div className="w-7 h-7 rounded-full bg-brand-orange flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-ink">{user?.name}</span>
                <ChevronDown size={14} className="text-ink-muted" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-surface-border rounded-xl shadow-2xl py-1 z-50 animate-fade-in"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-surface-border">
                    <p className="text-sm font-semibold text-ink">{user?.name}</p>
                    <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-surface-elevated transition-colors text-ink-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-border py-3 space-y-1 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-orange-glow text-brand-orange'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-surface-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors w-full"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
