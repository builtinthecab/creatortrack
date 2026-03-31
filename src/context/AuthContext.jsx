import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/db'
import { generateSeedHistory, DEFAULT_GOALS } from '../utils/seedData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const profile = await db.getProfile(authUser.id)
      // profile may be null if trigger hasn't fired yet — keep session alive with minimal data
      setUser({ id: authUser.id, email: authUser.email, onboarded: false, ...(profile ?? {}) })
    } catch {
      // Network or unexpected error — still keep the authenticated session
      setUser({ id: authUser.id, email: authUser.email, onboarded: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserProfile(session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data.user
  }, [])

  const signup = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: 'https://creatortrack-vert.vercel.app',
      },
    })
    if (error) throw new Error(error.message)
    // Profile row is created automatically by the handle_new_user DB trigger
    return data.user
  }, [])

  const completeOnboarding = useCallback(async (platforms, startingStats) => {
    if (!user) return

    // Update profile
    const updatedProfile = await db.updateProfile(user.id, { platforms, onboarded: true })

    // Seed 30-day history, goals, and starter streak
    const history = generateSeedHistory(startingStats)
    const today = new Date().toISOString().split('T')[0]

    await Promise.all([
      db.seedStats(user.id, history),
      db.seedGoals(user.id, DEFAULT_GOALS),
      db.upsertStreak(user.id, { current: 7, longest: 14, last_posted: today }),
    ])

    setUser(u => ({ ...u, ...updatedProfile }))
  }, [user])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadUserProfile(session.user)
  }, [loadUserProfile])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, completeOnboarding, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
