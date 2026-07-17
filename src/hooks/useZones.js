import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'

// Zones = the beds on the garden map: { name, x, y, rows, cols }
export function useZones(uid) {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const ref = collection(db, 'users', uid, 'zones')
    return onSnapshot(ref, snap => {
      setZones(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [uid])

  async function addZone(zone) {
    const ref = await addDoc(collection(db, 'users', uid, 'zones'), {
      ...zone,
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function moveZone(id, x, y) {
    await updateDoc(doc(db, 'users', uid, 'zones', id), { x, y })
  }

  async function removeZone(id) {
    await deleteDoc(doc(db, 'users', uid, 'zones', id))
  }

  return { zones, loading, addZone, moveZone, removeZone }
}
