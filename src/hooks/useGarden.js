import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, Timestamp, arrayUnion,
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
    const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : today
    const lastFertilized = plant.lastFertilized ? new Date(plant.lastFertilized) : today
    const ref = await addDoc(collection(db, 'users', uid, 'garden'), {
      ...plant,
      bedId: plant.bedId || null,
      cell: plant.cell || null,
      plantedAt: plant.plantedAt || null,
      photo: plant.photo || null,
      lastWatered: Timestamp.fromDate(lastWatered),
      nextWatering: Timestamp.fromDate(addDays(lastWatered, plant.watering_frequency_days)),
      lastFertilized: Timestamp.fromDate(lastFertilized),
      nextFertilizing: plant.fertilizing_frequency_days > 0
        ? Timestamp.fromDate(addDays(lastFertilized, plant.fertilizing_frequency_days))
        : null,
      photos: [],
      note: '',
      createdAt: serverTimestamp(),
    })
    return ref.id
  }

  async function assignToBed(id, bedId, cell) {
    await updateDoc(doc(db, 'users', uid, 'garden', id), { bedId, cell })
  }

  async function unassignFromBed(id) {
    await updateDoc(doc(db, 'users', uid, 'garden', id), { bedId: null, cell: null })
  }

  async function markWatered(id, watering_frequency_days) {
    const today = new Date()
    await updateDoc(doc(db, 'users', uid, 'garden', id), {
      lastWatered: Timestamp.fromDate(today),
      nextWatering: Timestamp.fromDate(addDays(today, watering_frequency_days)),
    })
  }

  async function markFertilized(id, fertilizing_frequency_days) {
    if (!fertilizing_frequency_days) return
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

  // journal photo: append to history + becomes the card thumbnail
  async function addPhoto(id, url) {
    await updateDoc(doc(db, 'users', uid, 'garden', id), {
      photos: arrayUnion({ url, uploadedAt: new Date().toISOString() }),
      photo: url,
    })
  }

  async function removePhoto(id, uploadedAt) {
    const plant = plants.find(p => p.id === id)
    if (!plant) return
    const remaining = (plant.photos || []).filter(ph => ph.uploadedAt !== uploadedAt)
    const newest = [...remaining].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))[0]
    await updateDoc(doc(db, 'users', uid, 'garden', id), {
      photos: remaining,
      photo: newest ? newest.url : null,
    })
  }

  async function removePlant(id) {
    // soft delete — пази историята на зоната за сеитбооборот (v2)
    await updateDoc(doc(db, 'users', uid, 'garden', id), { removedAt: Timestamp.fromDate(new Date()) })
  }

  return { plants, loading, addPlant, markWatered, markFertilized, updateNote, updatePhoto, addPhoto, removePhoto, removePlant, assignToBed, unassignFromBed }
}
