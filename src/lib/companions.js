// Companion relations between garden entries, based on plants.js companions data.

function isBadPair(catA, catB) {
  if (!catA || !catB) return false
  return catA.companions?.bad?.includes(catB.name) || catB.companions?.bad?.includes(catA.name)
}

function isGoodPair(catA, catB) {
  if (!catA || !catB) return false
  return catA.companions?.good?.includes(catB.name) || catB.companions?.good?.includes(catA.name)
}

// All bad-neighbor pairs within the same bed → [{ bedId, a, b }] (a/b = garden entries)
export function badPairsInBeds(entries, catalogById) {
  const byBed = {}
  entries.forEach(e => {
    if (!e.bedId || !e.cell) return
    ;(byBed[e.bedId] = byBed[e.bedId] || []).push(e)
  })
  const pairs = []
  Object.entries(byBed).forEach(([bedId, list]) => {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (isBadPair(catalogById[list[i].plantId], catalogById[list[j].plantId])) {
          pairs.push({ bedId, a: list[i], b: list[j] })
        }
      }
    }
  })
  return pairs
}

// Hints for a candidate plant against what's already in the bed → { good: [names], bad: [names] }
export function companionHints(candidate, bedEntries, catalogById) {
  const good = new Set()
  const bad = new Set()
  bedEntries.forEach(e => {
    const other = catalogById[e.plantId]
    if (!other) return
    if (isBadPair(candidate, other)) bad.add(other.name)
    else if (isGoodPair(candidate, other)) good.add(other.name)
  })
  return { good: [...good], bad: [...bad] }
}
