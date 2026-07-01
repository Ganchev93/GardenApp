export const STORAGE_KEY = 'my_garden_plants'

export function loadGarden() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export function saveGarden(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // quota exceeded — retry without photos
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.map(p => ({ ...p, photo: null }))))
    } catch {}
  }
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
