import { LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'

// Minimal stub — full profile page comes with Features Task 7
export default function Profile() {
  const { user, profile } = useAuth()

  return (
    <div className="anim-fade">
      <h1 className="mb-4" style={{ color: '#1E3A2F' }}>Профил</h1>
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: '#D4EDE0', color: '#1E3A2F' }}>
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </span>
          <div>
            <p className="font-semibold" style={{ color: '#1C2B23' }}>{user?.displayName || 'Градинар'}</p>
            <p className="text-sm" style={{ color: '#6A9E78' }}>{user?.email}</p>
          </div>
        </div>
        <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
          План: <span className="font-semibold" style={{ color: '#1C2B23' }}>
            {profile?.role === 'premium' ? 'Premium' : profile?.role === 'admin' ? 'Admin' : 'Безплатен'}
          </span>
        </p>
        <button onClick={() => signOut(auth)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: '#F5F2EC', color: '#1C2B23' }}>
          <LogOut size={15} /> Излез от акаунта
        </button>
      </div>
    </div>
  )
}
