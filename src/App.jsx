import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import Onboarding from './components/Onboarding/Onboarding'
import Dashboard from './components/Dashboard/Dashboard'
import AddStats from './components/AddStats/AddStats'
import Pricing from './components/Pricing/Pricing'
import Navbar from './components/Layout/Navbar'
import { TrendingUp } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(255,107,26,0.4)' }}>
          <TrendingUp size={20} className="text-white" />
        </div>
        <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarded) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  const showNav = user?.onboarded

  return (
    <Router>
      <div className="min-h-screen bg-surface-bg">
        {showNav && <Navbar />}
        <Routes>
          <Route path="/login"      element={!user ? <Login />      : <Navigate to="/dashboard" replace />} />
          <Route path="/signup"     element={!user ? <Signup />     : <Navigate to="/dashboard" replace />} />
          <Route path="/onboarding" element={user && !user.onboarded ? <Onboarding /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-stats"  element={<ProtectedRoute><AddStats /></ProtectedRoute>} />
          <Route path="/pricing"    element={<Pricing />} />
          <Route path="*"           element={<Navigate to={user?.onboarded ? '/dashboard' : user ? '/onboarding' : '/login'} replace />} />
        </Routes>
      </div>
    </Router>
  )
}
