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
