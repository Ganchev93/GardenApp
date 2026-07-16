import { NavLink } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { tabs } from './tabs'

function navStyle({ isActive }) {
  return {
    background: isActive ? '#D4EDE0' : 'transparent',
    color: isActive ? '#1E3A2F' : '#6A9E78',
  }
}

export default function Sidebar() {
  const { profile } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-60 z-40 p-5"
      style={{ background: '#fff', borderRight: '1px solid #D4EDE0' }}>
      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} style={navStyle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <t.Icon size={18} />
            {t.label}
          </NavLink>
        ))}
        {profile?.role === 'admin' && (
          <NavLink to="/admin" style={navStyle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-2">
            <Settings size={18} />
            Admin
          </NavLink>
        )}
      </nav>
      <button onClick={() => signOut(auth)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
        style={{ color: '#9CA3AF' }}>
        <LogOut size={16} /> Излез
      </button>
    </aside>
  )
}
