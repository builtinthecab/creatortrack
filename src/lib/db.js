import { supabase } from './supabase'

// Convert array of { date, platform_data } rows into history object
function rowsToHistory(rows) {
  const history = {}
  for (const row of rows) {
    history[row.date] = row.platform_data
  }
  return history
}

export const db = {
  // ── Profile ────────────────────────────────────────────────────────────────

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats(userId) {
    const { data, error } = await supabase
      .from('stats')
      .select('date, platform_data')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    if (error) throw error
    return rowsToHistory(data || [])
  },

  async upsertDailyStats(userId, date, platformData) {
    const { error } = await supabase
      .from('stats')
      .upsert(
        { user_id: userId, date, platform_data: platformData },
        { onConflict: 'user_id,date' }
      )
    if (error) throw error
  },

  async seedStats(userId, history) {
    const rows = Object.entries(history).map(([date, platform_data]) => ({
      user_id: userId,
      date,
      platform_data,
    }))
    const { error } = await supabase
      .from('stats')
      .upsert(rows, { onConflict: 'user_id,date' })
    if (error) throw error
  },

  // ── Goals ──────────────────────────────────────────────────────────────────

  async getGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  async addGoal(userId, goal) {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        label: goal.label,
        platform: goal.platform,
        metric: goal.metric,
        target: goal.target,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeGoal(goalId) {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) throw error
  },

  async seedGoals(userId, goals) {
    const rows = goals.map(g => ({
      user_id: userId,
      label: g.label,
      platform: g.platform,
      metric: g.metric,
      target: g.target,
    }))
    const { error } = await supabase.from('goals').insert(rows)
    if (error) throw error
  },

  // ── Streaks ────────────────────────────────────────────────────────────────

  async getStreak(userId) {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()
    // PGRST116 = no row found
    if (error && error.code === 'PGRST116') {
      return { current: 0, longest: 0, last_posted: null }
    }
    if (error) throw error
    return data || { current: 0, longest: 0, last_posted: null }
  },

  async upsertStreak(userId, streak) {
    const { error } = await supabase
      .from('streaks')
      .upsert(
        { user_id: userId, ...streak, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) throw error
  },
}
