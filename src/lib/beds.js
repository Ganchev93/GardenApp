export const BEDS_KEY = 'my_garden_beds'

export function loadBeds() {
  try { return JSON.parse(localStorage.getItem(BEDS_KEY)) || [] } catch { return [] }
}

export function saveBeds(beds) {
  try { localStorage.setItem(BEDS_KEY, JSON.stringify(beds)) } catch {}
}
