import { isBloomMonth } from '../../lib/growth'

const FIREFLIES = [
  { x: 180, y: 160, d: 0 }, { x: 420, y: 300, d: 1.4 }, { x: 700, y: 140, d: 2.8 },
  { x: 900, y: 340, d: 0.7 }, { x: 320, y: 460, d: 3.5 }, { x: 1050, y: 220, d: 2.1 },
]

// Ambient life: butterflies by day, fireflies by night, bees around blooming plants.
export default function Critters({ phase, bloomSpots }) {
  const night = phase === 'night'
  return (
    <g pointerEvents="none">
      {!night && (
        <>
          <text className="flutter-a" fontSize="13">🦋</text>
          <text className="flutter-b" fontSize="11">🦋</text>
        </>
      )}

      {night && FIREFLIES.map((f, i) => (
        <circle key={i} className="firefly" cx={f.x} cy={f.y} r={1.6}
          fill="#FFE9A0" style={{ animationDelay: `${f.d}s` }} />
      ))}

      {!night && bloomSpots.slice(0, 3).map((s, i) => (
        <g key={i} transform={`translate(${s.x}, ${s.y})`}>
          <text className="bee-orbit" fontSize="9" style={{ animationDelay: `${i * 1.7}s` }}>🐝</text>
        </g>
      ))}
    </g>
  )
}

export function bloomSpotsFrom(entries, catalogById, positions) {
  return entries
    .filter(e => e.bedId && e.cell && isBloomMonth(catalogById[e.plantId]?.calendar))
    .map(e => positions[e.uid])
    .filter(Boolean)
}
