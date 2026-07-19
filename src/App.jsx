import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Plants from './pages/Plants'
import MyGarden from './pages/MyGarden'
import Analyze from './pages/Analyze'
import Chat from './pages/Chat'
import Calendar from './pages/Calendar'
import Journal from './pages/Journal'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import './index.css'

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EDE8DF' }}>
        <Leaf size={32} className="animate-pulse" style={{ color: '#4A7C59' }} />
      </div>
    )
  }

  if (!user) return <Auth />

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/garden" element={<MyGarden />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
