import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Plants from './pages/Plants'
import MyGarden from './pages/MyGarden'
import Analyze from './pages/Analyze'
import Chat from './pages/Chat'
import Calendar from './pages/Calendar'
import './index.css'

function requestNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'default') return
  Notification.requestPermission().then(perm => {
    if (perm !== 'granted') return
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
  })
}

const tabs = [
  { to: '/', label: 'Начало', icon: '🏠' },
  { to: '/plants', label: 'Растения', icon: '🌿' },
  { to: '/garden', label: 'Градина', icon: '🌱' },
  { to: '/calendar', label: 'Календар', icon: '📅' },
  { to: '/analyze', label: 'Анализ', icon: '📷' },
  { to: '/chat', label: 'Агроном', icon: '💬' },
]

function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(t => {
          const active = location.pathname === t.to
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              {active && <span className="text-[9px] font-semibold text-green-600">{t.label}</span>}
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 py-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/garden" element={<MyGarden />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
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
