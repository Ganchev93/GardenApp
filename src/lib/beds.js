export const BEDS_KEY = 'my_garden_beds'
export const YARD_KEY = 'my_garden_yard'

// Yard: grid of paintable tiles (1 tile ≈ 1 m²)
export const TILE = 60
export const YARD_COLS = 20
export const YARD_ROWS = 13

function defaultYard() {
  const tiles = []
  for (let r = 3; r < 10; r++) {
    for (let c = 5; c < 15; c++) tiles.push(`${r}-${c}`)
  }
  return tiles
}

export function loadBeds() {
  try { return JSON.parse(localStorage.getItem(BEDS_KEY)) || [] } catch { return [] }
}

export function saveBeds(beds) {
  try { localStorage.setItem(BEDS_KEY, JSON.stringify(beds)) } catch {}
}

export function loadYard() {
  try {
    const saved = JSON.parse(localStorage.getItem(YARD_KEY))
    return new Set(saved?.length ? saved : defaultYard())
  } catch { return new Set(defaultYard()) }
}

export function saveYard(yard) {
  try { localStorage.setItem(YARD_KEY, JSON.stringify([...yard])) } catch {}
}
