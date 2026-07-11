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
