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
