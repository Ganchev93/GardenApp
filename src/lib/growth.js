// Growth stage from planting date. Entries without plantedAt (added via list) are mature.
const STAGE_DAYS = {
  'зеленчук': { seed: 4, sprout: 12, young: 30 },
  'цвете':    { seed: 4, sprout: 12, young: 30 },
  'билка':    { seed: 5, sprout: 14, young: 35 },
  'храст':    { seed: 10, sprout: 30, young: 90 },
  'дърво':    { seed: 14, sprout: 45, young: 150 },
}

export function growthStage(plantedAt, category) {
  if (!plantedAt) return 'mature'
  const days = Math.floor((Date.now() - new Date(plantedAt).getTime()) / 86400000)
  const t = STAGE_DAYS[category] || STAGE_DAYS['зеленчук']
  if (days < t.seed) return 'seed'
  if (days < t.sprout) return 'sprout'
  if (days < t.young) return 'young'
  return 'mature'
}

export function isHarvestMonth(calendar, month = new Date().getMonth() + 1) {
  return calendar?.harvest?.includes(month) || false
}

export function isBloomMonth(calendar, month = new Date().getMonth() + 1) {
  return calendar?.bloom?.includes(month) || false
}

export function dayPhase(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'dusk'
  return 'night'
}
