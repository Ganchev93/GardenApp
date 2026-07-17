import { db } from '../services/firebase'
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { loadGarden, STORAGE_KEY } from './garden'
import { loadBeds, loadYard, loadPaths, loadDecor, BEDS_KEY, YARD_KEY, PATHS_KEY, DECOR_KEY } from './beds'

const ts = s => Timestamp.fromDate(new Date(s))

// One-time import of the PoC localStorage garden into Firestore.
// Runs only when the Firestore garden is empty and pocMigrated is not set.
export async function migratePocData(uid) {
  const oldPlants = loadGarden()
  const oldBeds = loadBeds()
  const yard = [...loadYard()]
  const paths = [...loadPaths()]
  const decor = loadDecor()

  if (!oldPlants.length && !oldBeds.length) {
    await updateDoc(doc(db, 'users', uid), { pocMigrated: true })
    return false
  }

  const bedMap = {}
  for (const b of oldBeds) {
    const ref = await addDoc(collection(db, 'users', uid, 'zones'), {
      name: b.name, x: b.x, y: b.y, rows: b.rows, cols: b.cols,
      createdAt: serverTimestamp(),
    })
    bedMap[b.id] = ref.id
  }

  for (const p of oldPlants) {
    const fertFreq = p.fertilizing_frequency_days ?? p.frequency_days ?? 0
    await addDoc(collection(db, 'users', uid, 'garden'), {
      plantId: p.plantId,
      name: p.name,
      emoji: p.emoji,
      category: p.category,
      bedId: p.bedId ? bedMap[p.bedId] || null : null,
      cell: p.cell || null,
      plantedAt: p.plantedAt || null,
      photo: p.photo || null,
      note: p.note || '',
      lastWatered: ts(p.lastWatered),
      nextWatering: ts(p.nextWatering),
      watering_frequency_days: p.watering_frequency_days,
      watering_amount: p.watering_amount || '',
      lastFertilized: ts(p.lastFertilized),
      nextFertilizing: p.nextFertilizing ? ts(p.nextFertilizing) : null,
      fertilizing_frequency_days: fertFreq,
      fertilizer_type: p.fertilizer_type || '',
      dose: p.dose || '',
      photos: p.photos || [],
      createdAt: serverTimestamp(),
    })
  }

  await updateDoc(doc(db, 'users', uid), {
    yardTiles: yard, pathTiles: paths, decorItems: decor, pocMigrated: true,
  })

  ;[STORAGE_KEY, BEDS_KEY, YARD_KEY, PATHS_KEY, DECOR_KEY].forEach(k => localStorage.removeItem(k))
  return true
}
