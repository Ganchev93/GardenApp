# GardenCare Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Изгради production-ready foundation — Firebase Auth + Firestore, Cloudinary images, Firebase Functions backend (Gemini AI), rate limiting и security rules.

**Architecture:** Frontend (React + Vite) комуникира с Firebase директно за Auth и Firestore четене/писане. Всички AI извиквания и sensitive operations минават през Firebase Functions (Node.js) — API ключовете никога не достигат до frontend bundle. Cloudinary се използва за image storage с unsigned upload preset (безопасно за client-side).

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Firebase v11+ (Auth + Firestore + Functions + FCM), Cloudinary, Gemini 2.5 Flash, browser-image-compression, Vitest, React Testing Library

## Global Constraints

- Node.js ≥ 20 за Firebase Functions
- Firebase SDK: актуалната версия (v11+), modular API (`import { getAuth } from 'firebase/auth'`, не legacy `firebase.auth()`)
- Firestore схемата включва зони (zones-lite) и реколта (harvests) от ден 1 — UI за тях идва във Features Plan, но полетата съществуват, за да няма миграция на живи данни
- Име на полето за торене: `fertilizing_frequency_days` (НЕ голото `frequency_days` от PoC — беше объркващо)
- Всички env vars с префикс `VITE_` за frontend, без префикс за Functions
- Никога не commit `.env` файлове — само `.env.example`
- Firestore security rules: user достъпва само свои данни (`request.auth.uid == uid`)
- Rate limit: max 20 AI анализа/месец на free потребител, max 50 на premium
- Admin роля: `role: 'admin'` в Firestore документа на потребителя → без лимити
- Git branch: `git checkout -b v2` от main преди да почнеш

---

## File Structure

```
garden-app/
├── src/
│   ├── services/
│   │   ├── firebase.js          # Firebase app init + exports (auth, db, messaging)
│   │   ├── cloudinary.js        # uploadImage(file) → secure_url
│   │   └── functions.js         # httpsCallable wrappers за Firebase Functions
│   ├── hooks/
│   │   ├── useAuth.js           # AuthContext + onAuthStateChanged + profile
│   │   ├── useGarden.js         # CRUD за users/{uid}/garden collection
│   │   └── useFreemium.js       # checkLimit(), canAnalyze(), canAddPlant()
│   ├── pages/
│   │   └── Auth.jsx             # Login + Register + Google OAuth форма
│   └── App.jsx                  # Wrap с <AuthProvider>, protected routes
├── functions/
│   ├── package.json
│   ├── index.js                 # exports: analyzeImage, chatWithAgronomist
│   ├── ai.js                    # Gemini logic
│   └── rateLimiter.js           # checkAndIncrementUsage(uid, type)
├── firestore.rules
├── .env.example
└── CLAUDE.md
```

---

## Task 1: Git Branch + CLAUDE.md + .env Setup

**Files:**
- Create: `CLAUDE.md`
- Create: `.env.example`
- Modify: `.gitignore` (провери `.env` да е вътре)

**Interfaces:**
- Produces: работеща среда, всички dev знаят какви env vars са нужни

- [ ] **Step 1: Създай v2 branch**

```bash
cd C:\Users\Алекс\ClaudeProjects\garden-app
git checkout -b v2
```

Expected output: `Switched to a new branch 'v2'`

- [ ] **Step 2: Създай CLAUDE.md**

```markdown
# GardenCare — Real App

## Setup
- `npm install` — install deps
- `npm run dev` — frontend на http://localhost:5173
- `cd functions && npm install` — install Functions deps
- Firebase emulator: `firebase emulators:start`

## Tech Stack
- React 19 + Vite + Tailwind CSS v4
- Firebase v10 (Auth, Firestore, Functions, FCM)
- Cloudinary (image storage)
- Gemini 2.0 Flash (AI — само от Functions backend)

## Rules
- API ключове само в Functions — никога в frontend src/
- Freemium: free=20 AI анализа/месец, 3 растения; premium=unlimited
- Admin: role='admin' в Firestore → без лимити
- Всички Firestore операции проверяват auth в security rules
- Commit след всяка завършена задача

## Handoff — НЕ прави без потвърждение
- `firebase deploy` (production deploy)
- Промяна на Firestore security rules в production
- Изтриване на данни от Firestore
```

- [ ] **Step 3: Създай .env.example**

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Functions (само за local emulator)
GEMINI_API_KEY=
```

- [ ] **Step 4: Провери .gitignore съдържа .env**

Отвори `.gitignore`, провери че има ред `.env` (не само `.env.local`).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md .env.example .gitignore
git commit -m "chore: v2 branch setup, CLAUDE.md, env template"
```

---

## Task 2: Firebase Project + Firebase SDK Setup

**Files:**
- Create: `src/services/firebase.js`
- Modify: `package.json` (add firebase dep)

**Interfaces:**
- Produces: `auth`, `db`, `messaging` exports използвани от всички hooks

**Prerequisite (ръчно):**
1. Отиди на console.firebase.google.com → New Project → "garden-care-app"
2. Enable Authentication → Email/Password + Google
3. Enable Firestore Database → Start in test mode (rules ще добавим в Task 4)
4. Enable Cloud Messaging
5. Project Settings → Add Web App → копирай firebaseConfig
6. Попълни `.env` с копираните стойности

- [ ] **Step 1: Инсталирай Firebase SDK**

```bash
npm install firebase
```

Expected: `added N packages`

- [ ] **Step 2: Създай src/services/firebase.js**

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 3: Провери в браузъра**

`npm run dev` — отвори DevTools Console. Не трябва да има Firebase грешки.

- [ ] **Step 4: Commit**

```bash
git add src/services/firebase.js package.json package-lock.json
git commit -m "feat: Firebase SDK init (auth + firestore)"
```

---

## Task 3: Firebase Auth + useAuth Hook

**Files:**
- Create: `src/hooks/useAuth.js`
- Create: `src/pages/Auth.jsx`
- Modify: `src/App.jsx` (wrap с AuthProvider, add /auth route)

**Interfaces:**
- Produces: `useAuth()` → `{ user, profile, loading }` където `profile.role` е `'free' | 'premium' | 'admin'`

- [ ] **Step 1: Инсталирай test deps**

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Добави vitest config в vite.config.js**

⚠️ **Добави САМО `test` блока към съществуващия config. НЕ заменяй файла** — `tailwindcss()` plugin-ът и пълният VitePWA manifest (икони, цветове, workbox) трябва да останат непокътнати.

```js
// vite.config.js — съществуващото съдържание + test блок:
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({ /* съществуващият manifest config — НЕ го променяй */ }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 3: Създай src/test-setup.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Напиши failing test за useAuth**

Създай `src/hooks/useAuth.test.js`:

```js
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../services/firebase', () => ({
  auth: {},
  db: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {} }),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => new Date()),
}))

import { AuthProvider, useAuth } from './useAuth'

test('returns null user when not logged in', async () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
  const { result } = renderHook(() => useAuth(), { wrapper })
  expect(result.current.user).toBeNull()
  expect(result.current.loading).toBe(false)
})
```

- [ ] **Step 5: Провери тестът fails**

```bash
npx vitest run src/hooks/useAuth.test.js
```

Expected: FAIL — `useAuth` not defined

- [ ] **Step 6: Имплементирай src/hooks/useAuth.js**

```js
import { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          const newProfile = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: 'free',
            createdAt: serverTimestamp(),
            analysisCount: 0,
            analysisMonth: new Date().toISOString().slice(0, 7),
          }
          await setDoc(ref, newProfile)
          setProfile(newProfile)
        } else {
          setProfile(snap.data())
        }
        setUser(firebaseUser)
      } else {
        setUser(null)
        setProfile(null)
      }
    })
  }, [])

  const loading = user === undefined

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 7: Провери тестът passes**

```bash
npx vitest run src/hooks/useAuth.test.js
```

Expected: PASS

- [ ] **Step 8: Създай src/pages/Auth.jsx**

```jsx
import { useState } from 'react'
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
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="text-2xl font-bold text-green-800">GardenCare</h1>
          <p className="text-gray-500 text-sm mt-1">
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
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="password"
            placeholder="Парола"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Зареждане...' : mode === 'login' ? 'Влез' : 'Регистрирай се'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">или</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Продължи с Google
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          {mode === 'login' ? 'Нямаш акаунт?' : 'Вече имаш акаунт?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-green-600 font-medium"
          >
            {mode === 'login' ? 'Регистрирай се' : 'Влез'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Обнови App.jsx — добави AuthProvider и /auth route**

В `src/App.jsx` добави:
```jsx
import { AuthProvider, useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'

// Wrap AppInner:
function ProtectedApp() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">🌿</div></div>
  if (!user) return <Auth />
  return <AppInner />
}

// В App component:
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 10: Тествай в браузъра**

`npm run dev` → трябва да виждаш login формата. Регистрирай тестов потребител. Провери Firebase Console → Authentication → Users.

- [ ] **Step 11: Commit**

```bash
git add src/hooks/useAuth.js src/hooks/useAuth.test.js src/pages/Auth.jsx src/App.jsx src/test-setup.js vite.config.js package.json package-lock.json
git commit -m "feat: Firebase Auth — login, register, Google OAuth, useAuth hook"
```

---

## Task 4: Firestore Data Model + Security Rules

**Files:**
- Create: `firestore.rules`
- Create: `src/hooks/useGarden.js`
- Create: `src/hooks/useGarden.test.js`

**Interfaces:**
- Produces: `useGarden()` → `{ plants, addPlant, updatePlant, removePlant, markWatered, markFertilized, updateNote, loading }`
- Firestore structure:
  - `users/{uid}` — профил + counters
  - `users/{uid}/garden/{entryId}` — растения
  - `users/{uid}/zones/{zoneId}` — зони (zones-lite: "Леха до оградата", "Балкон юг"...)
  - `users/{uid}/harvests/{harvestId}` — записи за реколта

**Firestore документ — garden entry:**
```js
{
  plantId: number,
  name: string,
  emoji: string,
  category: string,
  zoneId: string | null,      // референция към users/{uid}/zones — null = без зона
  photo: string | null,       // Cloudinary URL
  note: string,
  lastWatered: Timestamp,
  nextWatering: Timestamp,
  watering_frequency_days: number,
  watering_amount: string,
  lastFertilized: Timestamp,
  nextFertilizing: Timestamp,
  fertilizing_frequency_days: number,
  fertilizer_type: string,
  dose: string,
  photos: Array<{ url: string, uploadedAt: Timestamp, analysisText: string }>,
  createdAt: Timestamp,
}
```

**Firestore документ — zone:**
```js
{
  name: string,               // "Леха до оградата"
  createdAt: Timestamp,
}
```
Зоните пазят история: когато растение се премахне, garden entry-то се пази с `removedAt: Timestamp` вместо да се трие — така сеитбооборотът (v2) знае какво е било в зоната предишни години.

**Firestore документ — harvest:**
```js
{
  gardenEntryId: string,      // garden doc ID
  plantId: number,
  name: string,               // "Домат" — денормализирано за списъци без join
  emoji: string,
  amount: number,
  unit: string,               // "кг" | "бр" | "връзки"
  date: Timestamp,
  note: string,
}
```

- [ ] **Step 1: Създай firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /garden/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /zones/{zoneId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /harvests/{harvestId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

- [ ] **Step 2: Deploy rules (ако Firebase CLI е инсталиран)**

```bash
firebase deploy --only firestore:rules
```

Ако нямаш Firebase CLI: `npm install -g firebase-tools`, после `firebase login`, после deploy.

- [ ] **Step 3: Напиши failing test за useGarden**

Създай `src/hooks/useGarden.test.js`:

```js
import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../services/firebase', () => ({ auth: { currentUser: { uid: 'test-uid' } }, db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((q, cb) => { cb({ docs: [] }); return () => {} }),
  addDoc: vi.fn().mockResolvedValue({ id: 'new-id' }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: { fromDate: vi.fn(d => d) },
}))

import { useGarden } from './useGarden'

test('starts with empty plants list', () => {
  const { result } = renderHook(() => useGarden('test-uid'))
  expect(result.current.plants).toEqual([])
})

test('addPlant calls addDoc', async () => {
  const { addDoc } = await import('firebase/firestore')
  const { result } = renderHook(() => useGarden('test-uid'))
  await act(async () => {
    await result.current.addPlant({ name: 'Домат', plantId: 1 })
  })
  expect(addDoc).toHaveBeenCalled()
})
```

- [ ] **Step 4: Провери тестовете fail**

```bash
npx vitest run src/hooks/useGarden.test.js
```

Expected: FAIL — `useGarden` not defined

- [ ] **Step 5: Имплементирай src/hooks/useGarden.js**

```js
import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function useGarden(uid) {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const ref = collection(db, 'users', uid, 'garden')
    return onSnapshot(ref, snap => {
      setPlants(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.removedAt))
      setLoading(false)
    })
  }, [uid])

  async function addPlant(plant) {
    const today = new Date()
    await addDoc(collection(db, 'users', uid, 'garden'), {
      ...plant,
      zoneId: plant.zoneId || null,
      lastWatered: Timestamp.fromDate(today),
      nextWatering: Timestamp.fromDate(addDays(today, plant.watering_frequency_days)),
      lastFertilized: Timestamp.fromDate(today),
      nextFertilizing: Timestamp.fromDate(addDays(today, plant.fertilizing_frequency_days)),
      photos: [],
      note: '',
      createdAt: serverTimestamp(),
    })
  }

  async function markWatered(id, watering_frequency_days) {
    const today = new Date()
    await updateDoc(doc(db, 'users', uid, 'garden', id), {
      lastWatered: Timestamp.fromDate(today),
      nextWatering: Timestamp.fromDate(addDays(today, watering_frequency_days)),
    })
  }

  async function markFertilized(id, fertilizing_frequency_days) {
    const today = new Date()
    await updateDoc(doc(db, 'users', uid, 'garden', id), {
      lastFertilized: Timestamp.fromDate(today),
      nextFertilizing: Timestamp.fromDate(addDays(today, fertilizing_frequency_days)),
    })
  }

  async function updateNote(id, note) {
    await updateDoc(doc(db, 'users', uid, 'garden', id), { note })
  }

  async function updatePhoto(id, photoUrl) {
    await updateDoc(doc(db, 'users', uid, 'garden', id), { photo: photoUrl })
  }

  async function removePlant(id) {
    // soft delete — пази историята на зоната за сеитбооборот (v2)
    await updateDoc(doc(db, 'users', uid, 'garden', id), { removedAt: Timestamp.fromDate(new Date()) })
  }

  return { plants, loading, addPlant, markWatered, markFertilized, updateNote, updatePhoto, removePlant }
}
```

- [ ] **Step 6: Провери тестовете pass**

```bash
npx vitest run src/hooks/useGarden.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add firestore.rules src/hooks/useGarden.js src/hooks/useGarden.test.js
git commit -m "feat: Firestore schema, security rules, useGarden hook"
```

---

## Task 5: Cloudinary Image Upload

**Files:**
- Create: `src/services/cloudinary.js`
- Create: `src/services/cloudinary.test.js`

**Interfaces:**
- Produces: `uploadImage(file)` → `Promise<string>` (secure_url)

**Prerequisite (ръчно):**
1. cloudinary.com → Create account
2. Settings → Upload → Add upload preset → Unsigned → folder: `garden-app`
3. Копирай Cloud Name и Preset Name в `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=твоето-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=garden-app-unsigned
   ```

- [ ] **Step 1: Инсталирай browser-image-compression**

```bash
npm install browser-image-compression
```

- [ ] **Step 2: Напиши failing test**

Създай `src/services/cloudinary.test.js`:

```js
import { vi } from 'vitest'

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ secure_url: 'https://res.cloudinary.com/test/image/upload/v1/garden-app/test.jpg' }),
})

import { uploadImage } from './cloudinary'

test('uploadImage returns secure_url', async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  const url = await uploadImage(file)
  expect(url).toBe('https://res.cloudinary.com/test/image/upload/v1/garden-app/test.jpg')
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('cloudinary.com'),
    expect.objectContaining({ method: 'POST' })
  )
})

test('uploadImage throws on failure', async () => {
  fetch.mockResolvedValueOnce({ ok: false })
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  await expect(uploadImage(file)).rejects.toThrow('Upload failed')
})
```

- [ ] **Step 3: Провери тестовете fail**

```bash
npx vitest run src/services/cloudinary.test.js
```

Expected: FAIL

- [ ] **Step 4: Имплементирай src/services/cloudinary.js**

```js
import imageCompression from 'browser-image-compression'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })

  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'garden-app')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.secure_url
}
```

- [ ] **Step 5: Провери тестовете pass**

```bash
npx vitest run src/services/cloudinary.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/services/cloudinary.js src/services/cloudinary.test.js package.json package-lock.json
git commit -m "feat: Cloudinary upload service with image compression"
```

---

## Task 6: Firebase Functions — Gemini AI Backend

**Files:**
- Create: `functions/package.json`
- Create: `functions/index.js`
- Create: `functions/ai.js`
- Create: `functions/rateLimiter.js`

**Interfaces:**
- Produces:
  - `analyzeImage({ imageBase64, mimeType })` → `{ text: string }`
  - `chatWithAgronomist({ messages: Array<{role, content}> })` → `{ text: string }`
- Frontend ги извиква чрез `httpsCallable` (вж. Task 7)

**Prerequisite (ръчно):**
1. `firebase init functions` в root на проекта → Node.js 20, JavaScript
2. Google AI Studio → получи Gemini API key
3. `firebase functions:secrets:set GEMINI_API_KEY` → въведи ключа
   (или за dev: `functions/.env` с `GEMINI_API_KEY=xxx` — НЕ commit-вай)

- [ ] **Step 1: Инсталирай Firebase CLI и init**

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

Избери: Use existing project → garden-care-app, JavaScript, No ESLint, Yes install deps

- [ ] **Step 2: Инсталирай Gemini SDK в functions/**

```bash
cd functions
npm install @google/generative-ai
cd ..
```

- [ ] **Step 3: Създай functions/rateLimiter.js**

```js
const { getFirestore } = require('firebase-admin/firestore')

const LIMITS = { free: 20, premium: 50, admin: Infinity }

async function checkAndIncrement(uid) {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const currentMonth = new Date().toISOString().slice(0, 7)

  return db.runTransaction(async tx => {
    const snap = await tx.get(userRef)
    const data = snap.data()
    const role = data?.role || 'free'
    const limit = LIMITS[role] ?? LIMITS.free

    const storedMonth = data?.analysisMonth || ''
    const count = storedMonth === currentMonth ? (data?.analysisCount || 0) : 0

    if (count >= limit) {
      throw new Error(`LIMIT_REACHED:${limit}`)
    }

    tx.update(userRef, {
      analysisCount: count + 1,
      analysisMonth: currentMonth,
    })

    return { allowed: true, remaining: limit - count - 1 }
  })
}

module.exports = { checkAndIncrement }
```

- [ ] **Step 4: Създай functions/ai.js**

```js
const { GoogleGenerativeAI } = require('@google/generative-ai')

const ANALYZE_PROMPT = `Ти си агроном и експерт по растения. Анализирай тази снимка подробно:

1. **Идентификация** — Какво е това растение? Вид и сорт ако е възможно.
2. **Здравен статус** — Здраво ли е? Болест, вредители, гъбички, хранителен дефицит?
3. **Нужди в момента** — Вода, тор, слънце, лечение?
4. **Напояване** — Честота и количество.
5. **Торене** — Вид тор, честота, сезон.
6. **Сезонни съвети** — Какво да правим сега.
7. **Чести проблеми** — Превенция.
8. **Следваща стъпка** — Едно действие днес.

Отговори на български. Структуриран формат с номерата.`

const CHAT_SYSTEM = `Ти си опитен агроном с 20 години опит. Помагаш на домашни градинари в България.
Отговаряй на български. Давай практични, конкретни съвети. Препоръчвай натурални методи преди химически.
Ако въпросът не е за градинарство, насочи разговора обратно към темата.`

async function analyzeImage(imageBase64, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
    ANALYZE_PROMPT,
  ])
  return result.response.text()
}

async function chatWithAgronomist(messages) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: CHAT_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Разбрано! Готов съм да помагам на градинари в България.' }] },
      ...messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ],
  })

  const lastMsg = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMsg.content)
  return result.response.text()
}

module.exports = { analyzeImage, chatWithAgronomist }
```

- [ ] **Step 5: Създай functions/index.js**

```js
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { checkAndIncrement } = require('./rateLimiter')
const { analyzeImage, chatWithAgronomist } = require('./ai')

initializeApp()

exports.analyzeImageFn = onCall(
  { region: 'europe-west1', secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

    const { imageBase64, mimeType } = request.data
    if (!imageBase64) throw new HttpsError('invalid-argument', 'No image')

    try {
      await checkAndIncrement(request.auth.uid)
    } catch (e) {
      if (e.message.startsWith('LIMIT_REACHED')) {
        const limit = e.message.split(':')[1]
        throw new HttpsError('resource-exhausted', `Достигнат месечен лимит от ${limit} анализа`)
      }
      throw e
    }

    const text = await analyzeImage(imageBase64, mimeType)
    return { text }
  }
)

exports.chatFn = onCall(
  { region: 'europe-west1', secrets: ['GEMINI_API_KEY'] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required')

    const { messages } = request.data
    if (!messages?.length) throw new HttpsError('invalid-argument', 'No messages')

    const text = await chatWithAgronomist(messages)
    return { text }
  }
)
```

- [ ] **Step 6: Тествай с emulator**

```bash
firebase emulators:start --only functions,firestore,auth
```

В отделен терминал тествай функцията (трябва да работи без грешки при стартиране).

- [ ] **Step 7: Commit**

```bash
git add functions/ firebase.json .firebaserc
git commit -m "feat: Firebase Functions — Gemini AI backend with rate limiting"
```

---

## Task 7: Frontend Functions Service + .env завършване

**Files:**
- Create: `src/services/functions.js`
- Create: `src/hooks/useFreemium.js`

**Interfaces:**
- Produces:
  - `callAnalyzeImage(base64, mimeType)` → `{ text }`
  - `callChat(messages)` → `{ text }`
  - `useFreemium()` → `{ canAnalyze, canAddPlant, analysisRemaining }`

- [ ] **Step 1: Създай src/services/functions.js**

```js
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from './firebase'

const functions = getFunctions(app, 'europe-west1')

export async function callAnalyzeImage(imageBase64, mimeType) {
  const fn = httpsCallable(functions, 'analyzeImageFn')
  const result = await fn({ imageBase64, mimeType })
  return result.data
}

export async function callChat(messages) {
  const fn = httpsCallable(functions, 'chatFn')
  const result = await fn({ messages })
  return result.data
}
```

- [ ] **Step 2: Експортирай `app` от firebase.js**

В `src/services/firebase.js` добави `export { app }` или промени на:
```js
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 3: Инсталирай firebase/functions**

Firebase functions client-side е вече в firebase пакета. Провери:
```bash
npm list firebase
```
Expected: `firebase@11.x` или по-нова

- [ ] **Step 4: Създай src/hooks/useFreemium.js**

```js
import { useAuth } from './useAuth'
import { useGarden } from './useGarden'

const LIMITS = {
  free: { plants: 3, analysisPerMonth: 20 },
  premium: { plants: Infinity, analysisPerMonth: 50 },
  admin: { plants: Infinity, analysisPerMonth: Infinity },
}

export function useFreemium() {
  const { user, profile } = useAuth()
  const { plants } = useGarden(user?.uid)

  const role = profile?.role || 'free'
  const limits = LIMITS[role] || LIMITS.free

  const currentMonth = new Date().toISOString().slice(0, 7)
  const analysisThisMonth = profile?.analysisMonth === currentMonth
    ? (profile?.analysisCount || 0)
    : 0

  const canAddPlant = plants.length < limits.plants
  const canAnalyze = analysisThisMonth < limits.analysisPerMonth
  const analysisRemaining = Math.max(0, limits.analysisPerMonth - analysisThisMonth)

  return { canAddPlant, canAnalyze, analysisRemaining, role, limits }
}
```

- [ ] **Step 5: Напиши test за useFreemium**

Създай `src/hooks/useFreemium.test.js`:
```js
import { vi } from 'vitest'

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1' },
    profile: { role: 'free', analysisCount: 5, analysisMonth: new Date().toISOString().slice(0, 7) }
  }))
}))

vi.mock('./useGarden', () => ({
  useGarden: vi.fn(() => ({ plants: [1, 2] }))
}))

import { useFreemium } from './useFreemium'
import { renderHook } from '@testing-library/react'

test('free user with 2 plants can add more (limit 3)', () => {
  const { result } = renderHook(() => useFreemium())
  expect(result.current.canAddPlant).toBe(true)
})

test('free user with 5 analyses remaining has 15 left', () => {
  const { result } = renderHook(() => useFreemium())
  expect(result.current.analysisRemaining).toBe(15)
})
```

- [ ] **Step 6: Провери тестовете pass**

```bash
npx vitest run src/hooks/useFreemium.test.js
```

Expected: PASS (2 tests)

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 8: Final commit**

```bash
git add src/services/functions.js src/hooks/useFreemium.js src/hooks/useFreemium.test.js
git commit -m "feat: Functions client service, useFreemium hook — Foundation complete"
```

- [ ] **Step 9: Push v2 branch**

```bash
git push -u origin v2
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Firebase Auth (email + Google)
- ✅ Firestore schema + security rules
- ✅ Cloudinary image upload + compression
- ✅ Firebase Functions (Gemini AI backend)
- ✅ Rate limiting (free 20/месец, premium 50, admin unlimited)
- ✅ useFreemium hook
- ✅ API ключове само на backend
- ✅ HTTPS (Firebase Hosting/Vercel дават автоматично)
- ⏳ DDoS (Cloudflare) — в Plan 2 при deploy
- ⏳ FCM push notifications — в Plan 2
- ⏳ Responsive layout — в Plan 2
- ⏳ Admin panel — в Plan 2

**Placeholder scan:** Няма TBD или TODO в tasks.

**Type consistency:** `useGarden` → `plants` array, `useAuth` → `{ user, profile, loading }`, `useFreemium` → `{ canAddPlant, canAnalyze, analysisRemaining, role }` — консистентно навсякъде.
