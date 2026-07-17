import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { db } from '../services/firebase'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'

const ROLE_STYLE = {
  free:    { bg: '#F0EBE3', color: '#6A9E78', label: 'Free' },
  premium: { bg: '#FDF3DC', color: '#7A4A00', label: 'Premium' },
  admin:   { bg: '#FFF0F0', color: '#7F1D1D', label: 'Admin' },
}

export default function Admin() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/')
      return
    }
    if (profile?.role === 'admin') loadUsers()
  }, [profile])

  async function loadUsers() {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      setError('Грешка при зареждане на потребителите')
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(uid, role) {
    setSaving(uid)
    setError(null)
    try {
      await updateDoc(doc(db, 'users', uid), { role })
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u))
    } catch {
      setError('Грешка при смяна на ролята')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Зареждане...</div>

  return (
    <div className="anim-fade">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={22} style={{ color: '#7F1D1D' }} />
        <h1 style={{ color: '#1E3A2F' }}>Admin панел</h1>
      </div>
      <p className="text-sm mb-4" style={{ color: '#6A9E78' }}>{users.length} потребители</p>

      {error && (
        <p className="text-sm mb-3 px-4 py-2.5 rounded-xl" style={{ background: '#FFF0F0', color: '#B03A2E' }}>
          {error}
        </p>
      )}

      <div className="space-y-2">
        {users.map(u => {
          const rs = ROLE_STYLE[u.role] || ROLE_STYLE.free
          const isSelf = u.id === user?.uid
          return (
            <div key={u.id} className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: '#D4EDE0', color: '#1E3A2F' }}>
                {(u.displayName || u.email || '?')[0].toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: '#1C2B23' }}>
                    {u.displayName || '—'}
                  </span>
                  {isSelf && <span className="text-xs" style={{ color: '#9CA3AF' }}>(ти)</span>}
                </div>
                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{u.email}</div>
                <div className="text-xs mt-0.5" style={{ color: '#B3D9C4' }}>
                  {u.analysisMonth === new Date().toISOString().slice(0, 7)
                    ? `${u.analysisCount || 0} анализа този месец`
                    : '0 анализа този месец'}
                </div>
              </div>
              <select
                value={u.role || 'free'}
                onChange={e => changeRole(u.id, e.target.value)}
                disabled={saving === u.id || isSelf}
                className="text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none disabled:opacity-50"
                style={{ background: rs.bg, color: rs.color, border: '1px solid #F0EBE3' }}>
                {Object.entries(ROLE_STYLE).map(([r, s]) => (
                  <option key={r} value={r}>{s.label}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
