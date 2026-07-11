import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { auth } from '../services/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'register' && password !== confirmPassword) {
      setError('Паролите не съвпадат')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Няма акаунт с този имейл',
        'auth/wrong-password': 'Грешна парола',
        'auth/invalid-credential': 'Грешен имейл или парола',
        'auth/email-already-in-use': 'Имейлът вече се използва',
        'auth/weak-password': 'Паролата трябва да е поне 6 символа',
      }
      setError(msgs[e.code] || 'Грешка при вход')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      setError('Грешка при вход с Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#EDE8DF' }}>
      <div className="rounded-2xl p-8 w-full max-w-sm" style={{ background: '#fff', border: '1px solid #D4EDE0' }}>
        <div className="text-center mb-6">
          <span className="w-12 h-12 rounded-xl inline-flex items-center justify-center mb-3"
            style={{ background: '#1E3A2F', color: '#D4EDE0' }}>
            <Leaf size={24} />
          </span>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#1E3A2F' }}>
            GardenCare
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6A9E78' }}>
            {mode === 'login' ? 'Влез в акаунта си' : 'Създай акаунт'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ border: '1px solid #D4EDE0', color: '#1C2B23', background: '#F5F2EC' }}
          />
          <input
            type="password"
            placeholder="Парола"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ border: '1px solid #D4EDE0', color: '#1C2B23', background: '#F5F2EC' }}
          />
          {mode === 'register' && (
            <input
              type="password"
              placeholder="Потвърди паролата"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ border: '1px solid #D4EDE0', color: '#1C2B23', background: '#F5F2EC' }}
            />
          )}
          {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-sm disabled:opacity-50"
            style={{ background: '#4A7C59', color: '#fff' }}
          >
            {loading ? 'Зареждане...' : mode === 'login' ? 'Влез' : 'Регистрирай се'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: '#F0EBE3' }} />
          <span className="text-xs" style={{ color: '#9CA3AF' }}>или</span>
          <div className="flex-1 h-px" style={{ background: '#F0EBE3' }} />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ border: '1px solid #D4EDE0', color: '#1C2B23', background: '#fff' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Продължи с Google
        </button>

        <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
          {mode === 'login' ? 'Нямаш акаунт?' : 'Вече имаш акаунт?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-medium"
            style={{ color: '#4A7C59' }}
          >
            {mode === 'login' ? 'Регистрирай се' : 'Влез'}
          </button>
        </p>
      </div>
    </div>
  )
}
