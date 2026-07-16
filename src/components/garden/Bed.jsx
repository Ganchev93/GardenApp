import { X } from 'lucide-react'
import PlantSprite from './PlantSprite'

export const CELL = 52
export const BED_PAD = 8

export function bedSize(bed) {
  return { w: bed.cols * CELL + BED_PAD * 2, h: bed.rows * CELL + BED_PAD * 2 }
}

export function cellCenter(bed, cell) {
  return {
    x: bed.x + BED_PAD + cell.col * CELL + CELL / 2,
    y: bed.y + BED_PAD + cell.row * CELL + CELL / 2,
  }
}

export default function Bed({
  bed, entries, catalogById, badPairs, today,
  editMode, justPlantedUid, wateringUid,
  onCellTap, onPlantTap, onBedPointerDown, onRemoveBed,
}) {
  const { w, h } = bedSize(bed)
  const byCell = {}
  entries.forEach(e => { byCell[`${e.cell.row}-${e.cell.col}`] = e })

  const cells = []
  for (let r = 0; r < bed.rows; r++) {
    for (let c = 0; c < bed.cols; c++) cells.push({ row: r, col: c })
  }

  return (
    <g
      onPointerDown={editMode ? e => onBedPointerDown(e, bed) : undefined}
      style={editMode ? { cursor: 'grab' } : undefined}
    >
      {/* soil */}
      <rect x={bed.x} y={bed.y} width={w} height={h} rx={12}
        fill="#8A6644" stroke="#6E4F33" strokeWidth={3} />
      <rect x={bed.x + 4} y={bed.y + 4} width={w - 8} height={h - 8} rx={9}
        fill="#7A5A3C" />

      {/* cell grid */}
      {cells.map(cell => {
        const { x, y } = cellCenter(bed, cell)
        const occupied = byCell[`${cell.row}-${cell.col}`]
        return (
          <g key={`${cell.row}-${cell.col}`}>
            <rect
              x={x - CELL / 2 + 3} y={y - CELL / 2 + 3}
              width={CELL - 6} height={CELL - 6} rx={7}
              fill={occupied ? 'transparent' : 'rgba(0,0,0,0.12)'}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}
              style={!editMode && !occupied ? { cursor: 'pointer' } : undefined}
              onClick={!editMode && !occupied ? e => { e.stopPropagation(); onCellTap(bed, cell) } : undefined}
            />
            {!occupied && !editMode && (
              <text x={x} y={y + 4} textAnchor="middle" fontSize="13"
                fill="rgba(255,255,255,0.25)" pointerEvents="none">+</text>
            )}
          </g>
        )
      })}

      {/* plants */}
      {entries.map(e => {
        const { x, y } = cellCenter(bed, e.cell)
        const thirsty = e.nextWatering <= today
        return (
          <PlantSprite key={e.uid} entry={e} cat={catalogById[e.plantId]}
            cx={x} cy={y} thirsty={thirsty}
            justPlanted={e.uid === justPlantedUid}
            watering={e.uid === wateringUid}
            onTap={onPlantTap} />
        )
      })}

      {/* bad neighbor warnings */}
      {badPairs.map((p, i) => {
        const a = cellCenter(bed, p.a.cell)
        const b = cellCenter(bed, p.b.cell)
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        return (
          <g key={i} pointerEvents="none">
            <line className="bad-link" x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#E74C3C" strokeWidth={2} strokeDasharray="7 7" opacity={0.8} />
            <circle cx={mx} cy={my} r={8} fill="#fff" stroke="#E74C3C" strokeWidth={1.5} />
            <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10">⚠</text>
          </g>
        )
      })}

      {/* name label */}
      <text x={bed.x + 2} y={bed.y - 8} fontSize="13" fontWeight="600"
        fill="#4A3A28" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        {bed.name}
      </text>

      {editMode && (
        <g onClick={e => { e.stopPropagation(); onRemoveBed(bed.id) }} style={{ cursor: 'pointer' }}
          onPointerDown={e => e.stopPropagation()}>
          <circle cx={bed.x + w} cy={bed.y} r={10} fill="#E74C3C" />
          <X size={12} x={bed.x + w - 6} y={bed.y - 6} color="#fff" strokeWidth={3} />
        </g>
      )}
      {editMode && (
        <rect x={bed.x - 4} y={bed.y - 4} width={w + 8} height={h + 8} rx={14}
          fill="none" stroke="#4A7C59" strokeWidth={2} strokeDasharray="6 5" pointerEvents="none" />
      )}
    </g>
  )
}
