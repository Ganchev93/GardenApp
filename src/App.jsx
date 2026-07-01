import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { House, BookOpen, Sprout, CalendarDays, Camera, MessageCircle, Leaf } from 'lucide-react'
import Home from './pages/Home'
import Plants from './pages/Plants'
import MyGarden from './pages/MyGarden'
import Analyze from './pages/Analyze'
import Chat from './pages/Chat'
import Calendar from './pages/Calendar'
import './index.css'

function showDueNotification() {
  try {
    const garden = JSON.parse(localStorage.getItem('my_garden_plants')) || []
    const today = new Date().toISOString().slice(0, 10)
    const due = garden.filter(p => p.nextWatering <= today || p.nextFertilizing <= today)
    if (due.length > 0) {
      new Notification('GardenCare 🌿', {
        body: `${due.length} растения чакат внимание днес`,
        icon: '/vite.svg',
      })
    }
  } catch {}
}

function requestNotifications() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    showDueNotification()
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') showDueNotification()
    })
  }
}

const tabs = [
  { to: '/', label: 'Начало', Icon: House },
  { to: '/plants', label: 'Растения', Icon: BookOpen },
  { to: '/garden', label: 'Градина', Icon: Sprout },
  { to: '/calendar', label: 'Календар', Icon: CalendarDays },
  { to: '/analyze', label: 'Анализ', Icon: Camera },
  { to: '/chat', label: 'Агроном', Icon: MessageCircle },
]

function Sidebar() {
  const location = useLocation()
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-50 p-5"
      style={{ background: '#fff', borderRight: '1px solid #D4EDE0' }}>
      <Link to="/" className="flex items-center gap-2.5 mb-8 px-2">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#1E3A2F', color: '#D4EDE0' }}>
          <Leaf size={18} />
        </span>
        <span className="text-lg font-semibold" style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#1E3A2F' }}>
          GardenCare
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {tabs.map(t => {
          const active = location.pathname === t.to
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: active ? '#D4EDE0' : 'transparent',
                color: active ? '#1E3A2F' : '#6A9E78',
              }}
            >
              <t.Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {t.label}
            </Link>
          )
        })}
      </nav>
      <p className="mt-auto px-3 text-xs" style={{ color: '#B3D9C4' }}>
        Градински дневник
      </p>
    </aside>
  )
}

function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ background: '#fff', borderTop: '1px solid #D4EDE0' }}>
      <div className="max-w-lg mx-auto flex">
        {tabs.map(t => {
          const active = location.pathname === t.to
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors"
              style={{ color: active ? '#1E3A2F' : '#9CA3AF' }}
            >
              <t.Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{t.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function AppInner() {
  useEffect(() => { requestNotifications() }, [])

  return (
    <div className="min-h-screen pb-20 lg:pb-0 lg:pl-60" style={{ background: '#EDE8DF' }}>
      <div className="max-w-lg lg:max-w-4xl mx-auto px-4 lg:px-10 py-5 lg:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/garden" element={<MyGarden />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
      <Sidebar />
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
