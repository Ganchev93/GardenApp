import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'

export function useHarvests(uid) {
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(db, 'users', uid, 'harvests'), snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => b.date.toMillis() - a.date.toMillis())
      setHarvests(items)
      setLoading(false)
    })
  }, [uid])

  async function addHarvest({ gardenEntryId, plantId, name, emoji, amount, unit, note = '' }) {
    await addDoc(collection(db, 'users', uid, 'harvests'), {
      gardenEntryId, plantId, name, emoji,
      amount: Number(amount), unit, note,
      date: Timestamp.fromDate(new Date()),
    })
  }

  async function removeHarvest(id) {
    await deleteDoc(doc(db, 'users', uid, 'harvests', id))
  }

  return { harvests, addHarvest, removeHarvest, loading }
}
