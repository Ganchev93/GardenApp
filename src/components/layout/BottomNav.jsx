import { NavLink } from 'react-router-dom'
import { tabs } from './tabs'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ background: '#fff', borderTop: '1px solid #D4EDE0' }}>
      <div className="max-w-lg mx-auto flex">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}
            className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
            style={({ isActive }) => ({ color: isActive ? '#1E3A2F' : '#9CA3AF' })}>
            {({ isActive }) => (
              <>
                <t.Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[9px] font-medium leading-none">{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
