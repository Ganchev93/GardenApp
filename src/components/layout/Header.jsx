import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, profile } = useAuth()

  return (
    <header className="sticky top-0 z-50" style={{ background: '#fff', borderBottom: '1px solid #D4EDE0' }}>
      <div className="h-14 px-4 lg:px-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#1E3A2F', color: '#D4EDE0' }}>
            <Leaf size={16} />
          </span>
          <span className="text-lg font-semibold" style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#1E3A2F' }}>
            GardenCare
          </span>
          {profile?.role === 'premium' && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#FDF3DC', color: '#7A4A00' }}>PRO</span>
          )}
          {profile?.role === 'admin' && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#FFF0F0', color: '#7F1D1D' }}>ADMIN</span>
          )}
        </Link>

        <Link to="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: '#D4EDE0', color: '#1E3A2F' }}>
          {(user?.displayName || user?.email || '?')[0].toUpperCase()}
        </Link>
      </div>
    </header>
  )
}
