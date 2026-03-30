import { useState } from 'react'
import { Target, Plus, X, Check, Trophy } from 'lucide-react'
import { db } from '../../lib/db'
import { formatNumber } from '../../utils/storage'

function GoalBar({ goal, current }) {
  const progress  = Math.min(100, (current / goal.target) * 100)
  const completed = progress >= 100

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {completed && <Trophy size={11} className="text-yellow-400" />}
          <span className={`text-sm font-medium ${completed ? 'text-yellow-400' : 'text-ink'}`}>
            {goal.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            {formatNumber(current)} / {formatNumber(goal.target)}
          </span>
          <span className={`text-xs font-bold ${completed ? 'text-yellow-400' : 'text-brand-orange'}`}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="progress-bar-bg">
        <div
          className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: completed
              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(90deg, #ff6b1a, #ff8c45)',
          }}
        />
      </div>
    </div>
  )
}

export default function GoalsCard({ goals: initialGoals, latestStats, userId }) {
  const [showAdd, setShowAdd]   = useState(false)
  const [newGoal, setNewGoal]   = useState({ label: '', platform: 'tiktok', metric: 'followers', target: '' })
  const [localGoals, setLocalGoals] = useState(initialGoals)
  const [saving, setSaving]     = useState(false)

  const getCurrentValue = (goal) => {
    if (!latestStats) return 0
    if (goal.platform === 'gumroad') {
      return goal.metric === 'revenue' ? latestStats?.gumroad?.revenue || 0 : latestStats?.gumroad?.sales || 0
    }
    return latestStats?.[goal.platform]?.[goal.metric] || 0
  }

  const handleAddGoal = async () => {
    if (!newGoal.label || !newGoal.target) return
    setSaving(true)
    try {
      const saved = await db.addGoal(userId, { ...newGoal, target: Number(newGoal.target) })
      setLocalGoals(g => [...g, saved])
      setNewGoal({ label: '', platform: 'tiktok', metric: 'followers', target: '' })
      setShowAdd(false)
    } catch (err) {
      console.error('Add goal error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      await db.removeGoal(id)
      setLocalGoals(g => g.filter(goal => goal.id !== id))
    } catch (err) {
      console.error('Remove goal error:', err)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="section-title">Goals</h3>
          <p className="text-xs text-ink-muted mt-0.5">{localGoals.length} active goals</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-border-bright hover:border-brand-orange-border hover:text-brand-orange transition-all duration-200 text-ink-secondary"
        >
          {showAdd ? <X size={12} /> : <Plus size={12} />}
          {showAdd ? 'Cancel' : 'Add Goal'}
        </button>
      </div>

      {/* Add goal form */}
      {showAdd && (
        <div className="mb-5 p-4 bg-surface-elevated rounded-xl border border-surface-border animate-fade-in">
          <p className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-3">New Goal</p>
          <div className="space-y-2.5">
            <input
              type="text"
              value={newGoal.label}
              onChange={e => setNewGoal(g => ({ ...g, label: e.target.value }))}
              placeholder="Goal name (e.g. TikTok 500K)"
              className="input-field text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newGoal.platform}
                onChange={e => setNewGoal(g => ({ ...g, platform: e.target.value }))}
                className="input-field text-sm appearance-none"
              >
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="gumroad">Gumroad</option>
              </select>
              <select
                value={newGoal.metric}
                onChange={e => setNewGoal(g => ({ ...g, metric: e.target.value }))}
                className="input-field text-sm appearance-none"
              >
                <option value="followers">Followers</option>
                <option value="subscribers">Subscribers</option>
                <option value="views">Views</option>
                <option value="revenue">Revenue ($)</option>
                <option value="sales">Sales</option>
              </select>
            </div>
            <input
              type="number"
              value={newGoal.target}
              onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))}
              placeholder="Target number"
              className="input-field text-sm"
            />
            <button
              onClick={handleAddGoal}
              disabled={!newGoal.label || !newGoal.target || saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #ff6b1a, #ff8c45)' }}
            >
              <Check size={14} /> {saving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-5">
        {localGoals.length === 0 ? (
          <div className="text-center py-6">
            <Target size={24} className="text-ink-faint mx-auto mb-2" />
            <p className="text-sm text-ink-muted">No goals yet. Add your first goal!</p>
          </div>
        ) : (
          localGoals.map(goal => (
            <div key={goal.id} className="group/goal">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <GoalBar goal={goal} current={getCurrentValue(goal)} />
                </div>
                <button
                  onClick={() => handleRemove(goal.id)}
                  className="opacity-0 group-hover/goal:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-ink-muted hover:text-red-400 mt-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
